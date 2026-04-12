import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-dark px-6">
      <View className="flex-1 justify-center items-center">
        <View className="bg-primary/20 rounded-full p-6 mb-6">
          <Ionicons name="fitness" size={64} color="#E8614D" />
        </View>
        <Text className="text-white text-3xl font-bold text-center">Peqo</Text>
        <Text className="text-gray-400 text-center mt-3 text-base leading-6">
          Your AI fitness companion.{"\n"}Talks, tracks, and trains with you.
        </Text>
      </View>

      <View className="pb-6">
        <Button title="Get Started" onPress={() => router.push("/(auth)/register")} className="mb-3" />
        <Button title="I already have an account" variant="ghost" onPress={() => router.push("/(auth)/login")} />
      </View>
    </SafeAreaView>
  );
}
