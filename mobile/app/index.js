import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { LoadingScreen } from "../components/ui";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (user) return <Redirect href="/(app)/(tabs)" />;
  return <Redirect href="/(auth)/welcome" />;
}
