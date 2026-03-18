import { Platform } from "react-native";
import { api } from "./api";

let Notifications = null;
let Device = null;

async function loadModules() {
  try {
    Notifications = require("expo-notifications");
    Device = require("expo-device");
  } catch {
    console.warn("[notifications] expo-notifications or expo-device not available");
  }
}

// Configure notification handling
export async function configureNotifications() {
  await loadModules();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// Register for push notifications and return the token
export async function registerForPushNotifications() {
  await loadModules();
  if (!Notifications || !Device) return null;

  // Must be a physical device
  if (!Device.isDevice) {
    console.warn("[notifications] Push notifications require a physical device");
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E8614D",
    });

    await Notifications.setNotificationChannelAsync("workouts", {
      name: "Workouts",
      description: "Workout reminders and updates",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E8614D",
    });

    await Notifications.setNotificationChannelAsync("health", {
      name: "Health Sync",
      description: "Health data sync notifications",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "fittracker",
    });
    return tokenData.data;
  } catch (err) {
    console.warn("[notifications] Failed to get push token:", err.message);
    return null;
  }
}

// Send push token to backend
export async function savePushToken(token) {
  if (!token) return;
  try {
    await api("/notifications/push-token", {
      method: "POST",
      body: { token, platform: Platform.OS },
    });
  } catch (err) {
    console.warn("[notifications] Failed to save push token:", err.message);
  }
}

// Listen for incoming notifications
export function addNotificationListener(callback) {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationReceivedListener(callback);
}

// Listen for notification responses (taps)
export function addNotificationResponseListener(callback) {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Schedule a local notification (e.g., rest timer done, workout reminder)
export async function scheduleLocalNotification({ title, body, data, seconds, channelId }) {
  if (!Notifications) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
      ...(Platform.OS === "android" && channelId ? { channelId } : {}),
    },
    trigger: seconds ? { seconds, type: "timeInterval" } : null,
  });
}

// Get badge count
export async function getBadgeCount() {
  if (!Notifications) return 0;
  return Notifications.getBadgeCountAsync();
}

// Set badge count
export async function setBadgeCount(count) {
  if (!Notifications) return;
  return Notifications.setBadgeCountAsync(count);
}
