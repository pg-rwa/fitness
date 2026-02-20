import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { Card, Badge, SectionHeader, Button } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isTrainer = user?.role === "trainer" || user?.role === "admin";
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    if (isTrainer) {
      api("/scheduling/sessions?status=requested&limit=5")
        .then((data) => setSchedule(data.data || []))
        .catch(() => {});
    }
  }, [isTrainer]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-dark px-5">
      <View className="pt-2 pb-8">
        <Text className="text-white text-2xl font-bold mb-4">{isTrainer ? "Trainer Hub" : "Profile"}</Text>

        {/* User card */}
        <Card className="flex-row items-center">
          <View className="bg-primary/20 rounded-full p-4 mr-4">
            <Ionicons name="person" size={28} color="#E8614D" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">{user?.first_name} {user?.last_name}</Text>
            <Text className="text-gray-400 text-sm">{user?.email}</Text>
            <Badge text={user?.role || "client"} color="primary" className="mt-1" />
          </View>
        </Card>

        {/* Trainer-specific sections */}
        {isTrainer && (
          <>
            <SectionHeader title="Quick Actions" />

            <TouchableOpacity
              onPress={() => router.push("/(app)/trainer/clients")}
              className="bg-dark-card rounded-2xl p-4 mb-2 flex-row items-center"
            >
              <View className="bg-blue-500/20 rounded-xl p-2.5 mr-3">
                <Ionicons name="people" size={22} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">My Clients</Text>
                <Text className="text-gray-400 text-xs">View and manage clients</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(app)/trainer/templates")}
              className="bg-dark-card rounded-2xl p-4 mb-2 flex-row items-center"
            >
              <View className="bg-green-500/20 rounded-xl p-2.5 mr-3">
                <Ionicons name="document-text" size={22} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">Workout Templates</Text>
                <Text className="text-gray-400 text-xs">Create and manage templates</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(app)/trainer/schedule")}
              className="bg-dark-card rounded-2xl p-4 mb-2 flex-row items-center"
            >
              <View className="bg-yellow-500/20 rounded-xl p-2.5 mr-3">
                <Ionicons name="calendar" size={22} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">Schedule</Text>
                <Text className="text-gray-400 text-xs">Manage availability & sessions</Text>
              </View>
              {schedule.length > 0 && (
                <View className="bg-primary rounded-full px-2.5 py-1 mr-2">
                  <Text className="text-white text-xs font-bold">{schedule.length}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(app)/trainer/equipment")}
              className="bg-dark-card rounded-2xl p-4 mb-2 flex-row items-center"
            >
              <View className="bg-purple-500/20 rounded-xl p-2.5 mr-3">
                <Ionicons name="hardware-chip" size={22} color="#A855F7" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">Equipment Library</Text>
                <Text className="text-gray-400 text-xs">Manage gym equipment</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </>
        )}

        {/* Settings */}
        <SectionHeader title="Settings" />
        <Card>
          <TouchableOpacity className="flex-row items-center py-2">
            <Ionicons name="notifications-outline" size={22} color="#6B7280" />
            <Text className="text-white ml-3 flex-1">Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
          <View className="border-t border-gray-700 my-1" />
          <TouchableOpacity className="flex-row items-center py-2">
            <Ionicons name="heart-outline" size={22} color="#6B7280" />
            <Text className="text-white ml-3 flex-1">Health Sync</Text>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
        </Card>

        <Button title="Sign Out" variant="danger" icon="log-out-outline" onPress={handleLogout} className="mt-6" />
      </View>
    </SafeAreaView>
  );
}
