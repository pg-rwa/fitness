import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../contexts/AuthContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { NetworkStatus } from "../components/NetworkStatus";
import { configureNotifications, registerForPushNotifications, savePushToken } from "../lib/notifications";
import { initOfflineSupport } from "../lib/offline";
import { connectWebSocket } from "../lib/websocket";

export default function RootLayout() {
  useEffect(() => {
    // Initialize app services
    (async () => {
      await configureNotifications();
      await initOfflineSupport();

      // Register push notifications
      const token = await registerForPushNotifications();
      if (token) await savePushToken(token);

      // Connect WebSocket for real-time updates
      connectWebSocket();
    })();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
        <NetworkStatus />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#1E1E2E" } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthProvider>
    </ErrorBoundary>
  );
}
