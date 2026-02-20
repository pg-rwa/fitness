import { Stack } from "expo-router";

export default function WorkoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#1E1E2E" } }}>
      <Stack.Screen name="start" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
