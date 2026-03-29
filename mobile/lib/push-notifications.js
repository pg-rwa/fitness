import { Platform } from "react-native";
import { api } from "./api";

let Notifications = null;

async function getNotificationsModule() {
  if (Notifications) return Notifications;
  try {
    Notifications = require("expo-notifications");
    return Notifications;
  } catch {
    console.log("[push] expo-notifications not installed");
    return null;
  }
}

export async function registerForPushNotifications() {
  const mod = await getNotificationsModule();
  if (!mod) return null;

  // Set notification handler
  mod.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Request permissions
  const { status: existingStatus } = await mod.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await mod.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[push] Permission not granted");
    return null;
  }

  // Get push token
  try {
    const tokenData = await mod.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Register with backend
    await api("/devices/register", {
      method: "POST",
      body: { token, platform: Platform.OS === "ios" ? "ios" : "android" },
    });

    console.log("[push] Registered token:", token);
    return token;
  } catch (err) {
    console.error("[push] Registration error:", err.message);
    return null;
  }
}

export async function unregisterPushNotifications(token) {
  if (!token) return;
  try {
    await api("/devices/unregister", { method: "POST", body: { token } });
  } catch {}
}

export function addNotificationListener(callback) {
  const mod = getNotificationsModule();
  if (!mod) return { remove: () => {} };

  const sub = mod.addNotificationReceivedListener(callback);
  return sub;
}

export function addNotificationResponseListener(callback) {
  const mod = getNotificationsModule();
  if (!mod) return { remove: () => {} };

  const sub = mod.addNotificationResponseReceivedListener(callback);
  return sub;
}
