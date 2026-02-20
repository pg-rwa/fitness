import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button, Input } from "../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "client" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    if (!form.firstName || !form.email || !form.password) return setError("Please fill in required fields");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    setError("");
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() });
      router.replace("/(app)/(tabs)");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} className="mt-2">
            <Text className="text-primary text-base">Back</Text>
          </TouchableOpacity>

          <Text className="text-white text-2xl font-bold mt-8 mb-2">Create Account</Text>
          <Text className="text-gray-400 mb-6">Start your fitness journey today</Text>

          {error ? <Text className="text-red-400 text-sm mb-4">{error}</Text> : null}

          {/* Role selector */}
          <Text className="text-gray-400 text-sm mb-2 ml-1">I am a</Text>
          <View className="flex-row mb-5">
            {["client", "trainer"].map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => update("role")(role)}
                className={`flex-1 py-3 rounded-xl mr-2 items-center border ${
                  form.role === role ? "bg-primary border-primary" : "bg-dark-card border-gray-600"
                }`}
              >
                <Text className="text-white font-semibold capitalize">{role}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="First Name" value={form.firstName} onChangeText={update("firstName")} placeholder="John" icon="person-outline" />
          <Input label="Last Name" value={form.lastName} onChangeText={update("lastName")} placeholder="Doe" icon="person-outline" />
          <Input label="Email" value={form.email} onChangeText={update("email")} placeholder="your@email.com" keyboardType="email-address" icon="mail-outline" />
          <Input label="Password" value={form.password} onChangeText={update("password")} placeholder="Min 6 characters" secureTextEntry icon="lock-closed-outline" />

          <Button title="Create Account" onPress={handleRegister} loading={loading} className="mt-2 mb-4" />

          <TouchableOpacity onPress={() => router.push("/(auth)/login")} className="pb-8 items-center">
            <Text className="text-gray-400">
              Already have an account? <Text className="text-primary font-semibold">Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
