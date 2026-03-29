import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button, Input } from "../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) return setError("Please fill in all fields");
    setLoading(true);
    setError("");
    try {
      __DEV__ && console.log("[login] Attempting login to:", process.env.EXPO_PUBLIC_API_URL);
      const user = await login(email.trim().toLowerCase(), password);
      __DEV__ && console.log("[login] Success, user:", user?.email, user?.role);
      // Navigation handled by auth layout redirect when user state updates
    } catch (err) {
      __DEV__ && console.log("[login] Error:", err.message);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mt-2">
          <Text className="text-primary text-base">Back</Text>
        </TouchableOpacity>

        <View className="flex-1 justify-center">
          <Text className="text-white text-2xl font-bold mb-8">Welcome back</Text>

          {error ? <Text className="text-red-400 text-sm mb-4">{error}</Text> : null}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            icon="mail-outline"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            icon="lock-closed-outline"
          />
          <Button title="Sign In" onPress={handleLogin} loading={loading} className="mt-4" />
        </View>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")} className="pb-6 items-center">
          <Text className="text-gray-400">
            Don't have an account? <Text className="text-primary font-semibold">Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
