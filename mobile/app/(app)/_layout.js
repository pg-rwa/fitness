import { Stack } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect } from "expo-router";
import { LoadingScreen } from "../../components/ui";

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect href="/(auth)/welcome" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#1E1E2E" } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="workout" />
      <Stack.Screen name="trainer" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="insights" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="social" />
    </Stack>
  );
}
