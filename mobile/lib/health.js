import { Platform } from "react-native";
import { api } from "./api";

// Health data service - abstracts HealthKit (iOS) and Health Connect (Android)
// Uses dynamic imports since native health modules require dev client builds

const METRIC_MAP = {
  steps: { unit: "steps", source_ios: "HKQuantityTypeIdentifierStepCount", source_android: "Steps" },
  heart_rate: { unit: "bpm", source_ios: "HKQuantityTypeIdentifierHeartRate", source_android: "HeartRate" },
  sleep_hours: { unit: "hours", source_ios: "HKCategoryTypeIdentifierSleepAnalysis", source_android: "SleepSession" },
  calories_burned: { unit: "kcal", source_ios: "HKQuantityTypeIdentifierActiveEnergyBurned", source_android: "ActiveCaloriesBurned" },
  active_minutes: { unit: "minutes", source_ios: "HKQuantityTypeIdentifierAppleExerciseTime", source_android: "ExerciseSession" },
  resting_heart_rate: { unit: "bpm", source_ios: "HKQuantityTypeIdentifierRestingHeartRate", source_android: "RestingHeartRate" },
};

let healthModule = null;
let isAvailable = null;

// Check if health platform is available
export async function checkHealthAvailability() {
  if (isAvailable !== null) return isAvailable;

  // Health modules require native builds (dev client) - not available in Expo Go.
  // Skip native health entirely; users can log manual records via the API.
  isAvailable = false;

  return isAvailable;
}

// Request permissions for health data access
export async function requestHealthPermissions() {
  const available = await checkHealthAvailability();
  if (!available) {
    return { granted: false, reason: "native_module_unavailable" };
  }

  try {
    if (Platform.OS === "ios") {
      const permissions = {
        permissions: {
          read: [
            "StepCount", "HeartRate", "ActiveEnergyBurned",
            "SleepAnalysis", "AppleExerciseTime", "RestingHeartRate",
          ],
          write: [],
        },
      };
      await new Promise((resolve, reject) => {
        healthModule.initHealthKit(permissions, (err) => {
          if (err) reject(new Error(err));
          else resolve();
        });
      });
      return { granted: true };
    }

    if (Platform.OS === "android") {
      const granted = await healthModule.requestPermission([
        { accessType: "read", recordType: "Steps" },
        { accessType: "read", recordType: "HeartRate" },
        { accessType: "read", recordType: "ActiveCaloriesBurned" },
        { accessType: "read", recordType: "SleepSession" },
        { accessType: "read", recordType: "ExerciseSession" },
        { accessType: "read", recordType: "RestingHeartRate" },
      ]);
      return { granted: !!granted };
    }
  } catch (err) {
    return { granted: false, reason: err.message };
  }

  return { granted: false };
}

// Read health data for a date range
async function readNativeHealthData(metric, startDate, endDate) {
  if (!healthModule) return [];

  try {
    if (Platform.OS === "ios") {
      return await readIOSHealthData(metric, startDate, endDate);
    }
    if (Platform.OS === "android") {
      return await readAndroidHealthData(metric, startDate, endDate);
    }
  } catch (err) {
    console.warn(`[health] Failed to read ${metric}:`, err.message);
    return [];
  }
  return [];
}

async function readIOSHealthData(metric, startDate, endDate) {
  const opts = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  const info = METRIC_MAP[metric];

  return new Promise((resolve) => {
    const cb = (err, results) => {
      if (err || !results) return resolve([]);
      resolve(
        results.map((r) => ({
          value: parseFloat(r.value || r.quantity || 0),
          unit: info.unit,
          recordedAt: r.startDate || r.start,
        }))
      );
    };

    switch (metric) {
      case "steps":
        healthModule.getDailyStepCountSamples(opts, cb);
        break;
      case "heart_rate":
        healthModule.getHeartRateSamples(opts, cb);
        break;
      case "calories_burned":
        healthModule.getActiveEnergyBurned(opts, cb);
        break;
      case "sleep_hours":
        healthModule.getSleepSamples(opts, (err, results) => {
          if (err || !results) return resolve([]);
          resolve(
            results.map((r) => {
              const hours = (new Date(r.endDate) - new Date(r.startDate)) / 3600000;
              return { value: Math.round(hours * 10) / 10, unit: "hours", recordedAt: r.startDate };
            })
          );
        });
        break;
      case "resting_heart_rate":
        healthModule.getRestingHeartRate(opts, cb);
        break;
      default:
        resolve([]);
    }
  });
}

async function readAndroidHealthData(metric, startDate, endDate) {
  const timeRange = {
    operator: "between",
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
  };
  const info = METRIC_MAP[metric];

  switch (metric) {
    case "steps": {
      const result = await healthModule.readRecords("Steps", { timeRangeFilter: timeRange });
      return (result.records || []).map((r) => ({
        value: r.count || 0, unit: info.unit, recordedAt: r.startTime,
      }));
    }
    case "heart_rate": {
      const result = await healthModule.readRecords("HeartRate", { timeRangeFilter: timeRange });
      return (result.records || []).flatMap((r) =>
        (r.samples || []).map((s) => ({
          value: s.beatsPerMinute || 0, unit: info.unit, recordedAt: s.time || r.startTime,
        }))
      );
    }
    case "calories_burned": {
      const result = await healthModule.readRecords("ActiveCaloriesBurned", { timeRangeFilter: timeRange });
      return (result.records || []).map((r) => ({
        value: r.energy?.inKilocalories || 0, unit: info.unit, recordedAt: r.startTime,
      }));
    }
    case "sleep_hours": {
      const result = await healthModule.readRecords("SleepSession", { timeRangeFilter: timeRange });
      return (result.records || []).map((r) => {
        const hours = (new Date(r.endTime) - new Date(r.startTime)) / 3600000;
        return { value: Math.round(hours * 10) / 10, unit: "hours", recordedAt: r.startTime };
      });
    }
    default:
      return [];
  }
}

// Sync health data to backend
export async function syncHealthData(metrics = ["steps", "heart_rate", "calories_burned", "sleep_hours", "active_minutes", "resting_heart_rate"]) {
  const available = await checkHealthAvailability();
  const source = Platform.OS === "ios" ? "apple_health" : "google_fit";
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1); // Last 24 hours

  const records = [];

  if (available) {
    for (const metric of metrics) {
      const data = await readNativeHealthData(metric, startDate, endDate);
      for (const d of data) {
        records.push({
          source,
          metricType: metric,
          value: d.value,
          unit: d.unit,
          recordedAt: d.recordedAt,
        });
      }
    }
  }

  if (records.length > 0) {
    const result = await api("/health-sync/records", { method: "POST", body: { records } });
    return { synced: result.inserted || 0, source };
  }

  return { synced: 0, source };
}

// Get health summary from backend
export async function getHealthSummary(date) {
  const dateStr = date || new Date().toISOString().split("T")[0];
  return api(`/health-sync/summary?date=${dateStr}`);
}

// Get health records from backend
export async function getHealthRecords(options = {}) {
  const params = new URLSearchParams();
  if (options.metric) params.append("metric", options.metric);
  if (options.source) params.append("source", options.source);
  if (options.start) params.append("start", options.start);
  if (options.end) params.append("end", options.end);
  if (options.page) params.append("page", options.page);
  if (options.limit) params.append("limit", options.limit);
  return api(`/health-sync/records?${params.toString()}`);
}

// Log a manual health record
export async function logManualRecord(metricType, value, unit, recordedAt) {
  return api("/health-sync/records", {
    method: "POST",
    body: {
      records: [{
        source: "manual",
        metricType,
        value: parseFloat(value),
        unit,
        recordedAt: recordedAt || new Date().toISOString(),
      }],
    },
  });
}

export { METRIC_MAP };
