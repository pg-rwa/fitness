import { Stack } from "expo-router";

export default function TrainerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="clients" />
      <Stack.Screen name="client-detail" />
      <Stack.Screen name="templates" />
      <Stack.Screen name="template-builder" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="equipment" />
    </Stack>
  );
}
