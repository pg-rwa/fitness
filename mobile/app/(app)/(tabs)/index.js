import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, StatCard, Badge, SectionHeader, PullToRefresh, EmptyState } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "../../../lib/format";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState({ data: [], unreadCount: 0 });
  const isTrainer = user?.role === "trainer" || user?.role === "admin";

  const loadData = useCallback(async () => {
    try {
      const [notifData, insightData] = await Promise.all([
        api("/notifications?limit=5"),
        api("/insights?limit=3"),
      ]);
      setNotifications(notifData);
      setInsights(insightData.data || []);

      if (!isTrainer) {
        const assignData = await api("/assigned-workouts/mine");
        setAssignments(assignData);
      }
    } catch {}
  }, [isTrainer]);

  useEffect(() => { loadData(); }, [loadData]);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <PullToRefresh onRefresh={loadData}>
        <View className="px-5 pb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between mt-2 mb-5">
            <View>
              <Text className="text-gray-400 text-sm">{today}</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                Hi, {user?.first_name || "there"}
              </Text>
            </View>
            <TouchableOpacity className="relative">
              <Ionicons name="notifications-outline" size={26} color="white" />
              {notifications.unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-primary rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{notifications.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View className="flex-row mb-2">
            <TouchableOpacity
              onPress={() => router.push("/(app)/workout/start")}
              className="flex-1 bg-primary rounded-2xl p-4 mr-2 flex-row items-center"
            >
              <Ionicons name="play-circle" size={32} color="white" />
              <View className="ml-3">
                <Text className="text-white font-bold text-base">Start Workout</Text>
                <Text className="text-white/70 text-xs">Begin a session</Text>
              </View>
            </TouchableOpacity>

            {isTrainer ? (
              <TouchableOpacity
                onPress={() => router.push("/(app)/trainer/clients")}
                className="flex-1 bg-dark-card rounded-2xl p-4 border border-gray-700"
              >
                <Ionicons name="people" size={28} color="#E8614D" />
                <Text className="text-white font-semibold mt-2">My Clients</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push("/(app)/(tabs)/nutrition")}
                className="flex-1 bg-dark-card rounded-2xl p-4 border border-gray-700"
              >
                <Ionicons name="restaurant" size={28} color="#F59E0B" />
                <Text className="text-white font-semibold mt-2">Log Meal</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Assigned Workouts */}
          {!isTrainer && assignments.length > 0 && (
            <>
              <SectionHeader title="Today's Plan" />
              {assignments.slice(0, 3).map((a) => (
                <Card key={a.id}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-primary/20 rounded-xl p-2.5 mr-3">
                        <Ionicons name="barbell" size={22} color="#E8614D" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold">{a.template_name}</Text>
                        {a.notes && <Text className="text-gray-400 text-xs mt-1">{a.notes}</Text>}
                      </View>
                    </View>
                    <Badge text={a.difficulty || "Assigned"} color="primary" />
                  </View>
                </Card>
              ))}
            </>
          )}

          {/* AI Insights */}
          {insights.length > 0 && (
            <>
              <SectionHeader title="Insights" />
              {insights.map((insight) => {
                const iconMap = { trend: "trending-up", habit: "flame", tip: "bulb", milestone: "trophy", warning: "warning" };
                const colorMap = { trend: "#3B82F6", habit: "#10B981", tip: "#F59E0B", milestone: "#E8614D", warning: "#EF4444" };
                return (
                  <Card key={insight.id}>
                    <View className="flex-row items-start">
                      <View className="rounded-xl p-2 mr-3" style={{ backgroundColor: (colorMap[insight.type] || "#6B7280") + "20" }}>
                        <Ionicons name={iconMap[insight.type] || "information-circle"} size={20} color={colorMap[insight.type] || "#6B7280"} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold">{insight.title}</Text>
                        <Text className="text-gray-400 text-sm mt-1">{insight.body}</Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </>
          )}

          {/* Recent Notifications */}
          {notifications.data?.length > 0 && (
            <>
              <SectionHeader title="Recent Activity" />
              {notifications.data.slice(0, 3).map((n) => (
                <Card key={n.id}>
                  <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full mr-3 ${n.is_read ? "bg-gray-600" : "bg-primary"}`} />
                    <View className="flex-1">
                      <Text className="text-white text-sm font-medium">{n.title}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">{n.body}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </>
          )}
        </View>
      </PullToRefresh>
    </SafeAreaView>
  );
}
