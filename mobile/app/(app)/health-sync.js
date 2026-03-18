import { View, Text, TouchableOpacity, Alert, Platform } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Badge, Button, SectionHeader, PullToRefresh, StatCard, EmptyState } from "../../components/ui";
import {
  checkHealthAvailability,
  requestHealthPermissions,
  syncHealthData,
  getHealthSummary,
  logManualRecord,
  METRIC_MAP,
} from "../../lib/health";

const METRICS_CONFIG = [
  { key: "steps", label: "Steps", icon: "footsteps", color: "#3B82F6", unit: "steps", format: (v) => Math.round(v).toLocaleString() },
  { key: "heart_rate", label: "Heart Rate", icon: "heart", color: "#EF4444", unit: "bpm", format: (v) => Math.round(v) },
  { key: "calories_burned", label: "Calories", icon: "flame", color: "#F59E0B", unit: "kcal", format: (v) => Math.round(v).toLocaleString() },
  { key: "sleep_hours", label: "Sleep", icon: "moon", color: "#8B5CF6", unit: "hrs", format: (v) => (Math.round(v * 10) / 10).toString() },
  { key: "active_minutes", label: "Active Min", icon: "walk", color: "#10B981", unit: "min", format: (v) => Math.round(v) },
  { key: "resting_heart_rate", label: "Resting HR", icon: "pulse", color: "#EC4899", unit: "bpm", format: (v) => Math.round(v) },
];

export default function HealthSyncScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [isAvailable, setIsAvailable] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [manualEntry, setManualEntry] = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await getHealthSummary();
      setSummary(data.summary || {});
    } catch {}
  }, []);

  useEffect(() => {
    checkHealthAvailability().then((available) => {
      setIsAvailable(available);
      setIsConnected(available);
    });
    loadSummary();
  }, [loadSummary]);

  const handleConnect = async () => {
    const result = await requestHealthPermissions();
    if (result.granted) {
      setIsConnected(true);
      Alert.alert("Connected", `${Platform.OS === "ios" ? "Apple Health" : "Health Connect"} connected successfully!`);
      handleSync();
    } else if (result.reason === "native_module_unavailable") {
      Alert.alert(
        "Not Available",
        "Health integration requires a development build. You can still log data manually.",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert("Permission Denied", "Please grant health data access in your device settings.");
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncHealthData();
      setLastSync(new Date());
      await loadSummary();
      if (result.synced > 0) {
        Alert.alert("Synced", `${result.synced} health records synced from ${result.source.replace("_", " ")}`);
      } else {
        Alert.alert("Up to Date", "No new health data to sync.");
      }
    } catch (err) {
      Alert.alert("Sync Failed", err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleManualLog = async (metric) => {
    const config = METRICS_CONFIG.find((m) => m.key === metric.key);
    Alert.prompt?.(
      `Log ${config.label}`,
      `Enter ${config.label.toLowerCase()} value (${config.unit}):`,
      async (value) => {
        if (!value || isNaN(parseFloat(value))) return;
        try {
          await logManualRecord(metric.key, value, config.unit);
          await loadSummary();
          Alert.alert("Logged", `${config.label}: ${value} ${config.unit}`);
        } catch (err) {
          Alert.alert("Error", err.message);
        }
      },
      "plain-text",
      "",
      "numeric"
    ) || setManualEntry(metric);
  };

  const sourceName = Platform.OS === "ios" ? "Apple Health" : "Health Connect";
  const sourceIcon = Platform.OS === "ios" ? "logo-apple" : "fitness";

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <PullToRefresh onRefresh={loadSummary}>
        <View className="px-5 pb-8">
          {/* Header */}
          <View className="flex-row items-center mt-2 mb-5">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold flex-1">Health Sync</Text>
            {isConnected && (
              <TouchableOpacity onPress={handleSync} disabled={syncing}>
                <Ionicons name="sync" size={24} color={syncing ? "#6B7280" : "#E8614D"} />
              </TouchableOpacity>
            )}
          </View>

          {/* Connection status */}
          <Card className="mb-2">
            <View className="flex-row items-center">
              <View className={`rounded-xl p-2.5 mr-3 ${isConnected ? "bg-green-500/20" : "bg-gray-700/50"}`}>
                <Ionicons name={sourceIcon} size={24} color={isConnected ? "#10B981" : "#6B7280"} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">{sourceName}</Text>
                <View className="flex-row items-center mt-1">
                  <View className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-400" : "bg-gray-500"}`} />
                  <Text className="text-gray-400 text-sm">
                    {isConnected ? "Connected" : isAvailable === false ? "Requires dev build" : "Not connected"}
                  </Text>
                </View>
                {lastSync && (
                  <Text className="text-gray-500 text-xs mt-1">
                    Last sync: {lastSync.toLocaleTimeString()}
                  </Text>
                )}
              </View>
              {!isConnected && (
                <Button title="Connect" variant="secondary" onPress={handleConnect} className="py-2 px-4" />
              )}
            </View>
          </Card>

          {/* Today's Summary */}
          <SectionHeader title="Today's Health Data" />

          {summary ? (
            <>
              <View className="flex-row mb-2">
                <StatCard
                  label="Steps"
                  value={summary.steps?.value ? Math.round(summary.steps.value).toLocaleString() : "—"}
                  icon="footsteps"
                  color="#3B82F6"
                />
                <StatCard
                  label="Calories"
                  value={summary.calories_burned?.value ? Math.round(summary.calories_burned.value).toLocaleString() : "—"}
                  unit="kcal"
                  icon="flame"
                  color="#F59E0B"
                />
              </View>
              <View className="flex-row mb-2">
                <StatCard
                  label="Heart Rate"
                  value={summary.heart_rate?.value ? Math.round(summary.heart_rate.value) : "—"}
                  unit="bpm"
                  icon="heart"
                  color="#EF4444"
                />
                <StatCard
                  label="Sleep"
                  value={summary.sleep_hours?.value ? (Math.round(summary.sleep_hours.value * 10) / 10).toString() : "—"}
                  unit="hrs"
                  icon="moon"
                  color="#8B5CF6"
                />
              </View>
              <View className="flex-row mb-2">
                <StatCard
                  label="Active Min"
                  value={summary.active_minutes?.value ? Math.round(summary.active_minutes.value) : "—"}
                  unit="min"
                  icon="walk"
                  color="#10B981"
                />
                <StatCard
                  label="Resting HR"
                  value={summary.resting_heart_rate?.value ? Math.round(summary.resting_heart_rate.value) : "—"}
                  unit="bpm"
                  icon="pulse"
                  color="#EC4899"
                />
              </View>
            </>
          ) : (
            <EmptyState
              icon="heart-outline"
              title="No Health Data"
              message={isConnected ? "Sync your device to see health data" : "Connect a health source or log manually"}
            />
          )}

          {/* Manual Logging */}
          <SectionHeader title="Quick Log" />
          <View className="flex-row flex-wrap gap-2">
            {METRICS_CONFIG.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => handleManualLog(m)}
                className="bg-dark-card rounded-xl px-4 py-3 flex-row items-center border border-gray-700"
                activeOpacity={0.7}
              >
                <Ionicons name={m.icon} size={18} color={m.color} />
                <Text className="text-white text-sm ml-2">{m.label}</Text>
                <Ionicons name="add-circle-outline" size={16} color="#6B7280" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Manual Entry Modal (for Android which doesn't have Alert.prompt) */}
          {manualEntry && (
            <ManualEntryCard
              metric={manualEntry}
              onSubmit={async (value) => {
                try {
                  const config = METRICS_CONFIG.find((m) => m.key === manualEntry.key);
                  await logManualRecord(manualEntry.key, value, config.unit);
                  await loadSummary();
                  setManualEntry(null);
                  Alert.alert("Logged", `${config.label}: ${value} ${config.unit}`);
                } catch (err) {
                  Alert.alert("Error", err.message);
                }
              }}
              onCancel={() => setManualEntry(null)}
            />
          )}

          {/* Info */}
          <SectionHeader title="About Health Sync" />
          <Card>
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-gray-300 text-sm leading-5">
                  Health Sync connects to {Platform.OS === "ios" ? "Apple Health" : "Google Health Connect"} to
                  automatically import your steps, heart rate, sleep, and activity data. Data syncs are stored
                  securely and used to provide personalized AI fitness insights.
                </Text>
                {isAvailable === false && (
                  <Text className="text-yellow-400 text-sm mt-2">
                    Note: Native health integration requires a development build (EAS Build). You can still
                    log health data manually using the Quick Log buttons above.
                  </Text>
                )}
              </View>
            </View>
          </Card>
        </View>
      </PullToRefresh>
    </SafeAreaView>
  );
}

function ManualEntryCard({ metric, onSubmit, onCancel }) {
  const [value, setValue] = useState("");
  const config = METRICS_CONFIG.find((m) => m.key === metric.key);

  return (
    <Card className="mt-4 border border-primary/30">
      <Text className="text-white font-semibold mb-3">Log {config.label}</Text>
      <View className="flex-row items-center">
        <View className="flex-1 bg-dark rounded-xl px-4 py-3 mr-3 flex-row items-center">
          <Ionicons name={config.icon} size={18} color={config.color} />
          <Text className="text-white ml-2" style={{ flex: 0 }}>
            {/* Using a simple text input approach */}
          </Text>
          <View className="flex-1">
            <Text
              className="text-gray-400 text-sm"
              onPress={() => {
                // For Android - use a different input method
                Alert.alert(
                  `Log ${config.label}`,
                  `Enter value in ${config.unit}`,
                  [
                    { text: "Cancel", onPress: onCancel, style: "cancel" },
                    {
                      text: "Log",
                      onPress: () => onSubmit(value || "0"),
                    },
                  ]
                );
              }}
            >
              Tap to enter {config.unit}...
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onCancel} className="p-2">
          <Ionicons name="close" size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </Card>
  );
}
