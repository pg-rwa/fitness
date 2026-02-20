import { Stack } from "expo-router";

export default function TrainerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#1E1E2E" } }}>
      <Stack.Screen name="clients" />
      <Stack.Screen name="client-detail" />
      <Stack.Screen name="templates" />
      <Stack.Screen name="template-builder" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="equipment" />
    </Stack>
  );
}
