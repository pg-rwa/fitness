/**
 * Push notification delivery service.
 * Uses Expo Push API for sending notifications to mobile devices.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function sendPushNotification(token, notification, platform = "expo") {
  if (!token) return;

  if (platform === "expo" || token.startsWith("ExponentPushToken")) {
    return sendExpoPush(token, notification);
  }

  // For native iOS/Android tokens, log for now (FCM/APNs integration can be added later)
  console.log(`[push] Would send to ${platform} token: ${token.slice(0, 20)}...`, notification.title);
}

async function sendExpoPush(token, { title, body, data }) {
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title,
        body,
        data: data || {},
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[push] Expo push failed:", err);
    }
  } catch (err) {
    console.error("[push] Expo push error:", err.message);
  }
}

module.exports = { sendPushNotification };
