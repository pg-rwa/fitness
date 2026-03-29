import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, StatCard, Badge, SectionHeader, PullToRefresh, EmptyState } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "../../../lib/format";
import { getHealthSummary } from "../../../lib/health";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState({ data: [], unreadCount: 0 });
  const [healthSummary, setHealthSummary] = useState(null);
  const isTrainer = user?.role === "trainer" || user?.role === "admin";

  const [trainerStats, setTrainerStats] = useState({ clients: 0, templates: 0, upcoming: 0, weekSessions: 0 });
  const [upcomingSessions, setUpcomingSessions] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [notifData, insightData, healthData] = await Promise.all([
        api("/notifications?limit=5"),
        api("/insights?limit=3"),
        getHealthSummary().catch(() => null),
      ]);
      setNotifications(notifData);
      setInsights(insightData.data || []);
      if (healthData?.summary) setHealthSummary(healthData.summary);

      if (isTrainer) {
        const [sessions, templates, scheduled, clients] = await Promise.all([
          api("/workout-sessions?limit=20").catch(() => ({ data: [] })),
          api("/workout-templates?limit=1&ownOnly=true").catch(() => ({ pagination: { total: 0 } })),
          api("/scheduling/sessions?limit=10").catch(() => ({ data: [] })),
          api("/users/my-clients").catch(() => []),
        ]);
        const allSessions = sessions.data || [];
        const allScheduled = (scheduled.data || []).filter(s => s.status === "confirmed" || s.status === "pending");
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekSessions = allSessions.filter(s => {
          const d = new Date(s.started_at || s.created_at);
          return d >= weekAgo && s.ended_at;
        }).length;
        setTrainerStats({
          clients: Array.isArray(clients) ? clients.length : 0,
          templates: templates.pagination?.total || 0,
          upcoming: allScheduled.length,
          weekSessions,
        });
        setUpcomingSessions(allScheduled.slice(0, 3));
      } else {
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
            <TouchableOpacity className="relative" onPress={() => router.push("/(app)/notifications")}>
              <Ionicons name="notifications-outline" size={26} color="white" />
              {notifications.unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-primary rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{notifications.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          {isTrainer ? (
            <>
              {/* Trainer: Stats Grid */}
              <View className="flex-row mb-2 gap-2">
                <StatCard label="Clients" value={trainerStats.clients} icon="people" color="#E8614D" />
                <StatCard label="Templates" value={trainerStats.templates} icon="document-text" color="#3B82F6" />
                <StatCard label="Upcoming" value={trainerStats.upcoming} icon="calendar" color="#10B981" />
                <StatCard label="This Week" value={trainerStats.weekSessions} icon="barbell" color="#F59E0B" />
              </View>

              {/* Weekly Progress Bar */}
              {trainerStats.clients > 0 && (
                <Card className="mb-1">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white font-semibold text-sm">Weekly Progress</Text>
                    <Text className="text-gray-400 text-xs">{trainerStats.weekSessions} / {Math.max(trainerStats.clients * 2, 5)} sessions</Text>
                  </View>
                  <View className="w-full bg-gray-700 h-2 rounded-full">
                    <View className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, Math.round((trainerStats.weekSessions / Math.max(trainerStats.clients * 2, 5)) * 100))}%` }} />
                  </View>
                </Card>
              )}

              {/* Trainer: primary actions */}
              <View className="flex-row mb-2">
                <TouchableOpacity
                  onPress={() => router.push("/(app)/(tabs)/clients")}
                  className="flex-1 bg-primary rounded-2xl p-4 mr-2 flex-row items-center"
                >
                  <Ionicons name="people" size={32} color="white" />
                  <View className="ml-3">
                    <Text className="text-white font-bold text-base">My Clients</Text>
                    <Text className="text-white/70 text-xs">View & manage</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/(app)/trainer/templates")}
                  className="flex-1 bg-dark-card rounded-2xl p-4 border border-gray-700"
                >
                  <Ionicons name="document-text" size={28} color="#10B981" />
                  <Text className="text-white font-semibold mt-2">Templates</Text>
                </TouchableOpacity>
              </View>

              {/* Trainer: secondary row */}
              <View className="flex-row mb-2 gap-2">
                <TouchableOpacity
                  onPress={() => router.push("/(app)/trainer/exercises")}
                  className="flex-1 bg-dark-card rounded-2xl p-3 border border-gray-700 flex-row items-center"
                >
                  <Ionicons name="barbell" size={20} color="#E8614D" />
                  <Text className="text-white font-medium text-sm ml-2">Exercises</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/(app)/(tabs)/schedule")}
                  className="flex-1 bg-dark-card rounded-2xl p-3 border border-gray-700 flex-row items-center"
                >
                  <Ionicons name="calendar" size={20} color="#F59E0B" />
                  <Text className="text-white font-medium text-sm ml-2">Schedule</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row mb-2 gap-2">
                <TouchableOpacity
                  onPress={() => router.push("/(app)/trainer/equipment")}
                  className="flex-1 bg-dark-card rounded-2xl p-3 border border-gray-700 flex-row items-center"
                >
                  <Ionicons name="hardware-chip" size={20} color="#A855F7" />
                  <Text className="text-white font-medium text-sm ml-2">Equipment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/(app)/insights")}
                  className="flex-1 bg-dark-card rounded-2xl p-3 border border-gray-700 flex-row items-center"
                >
                  <Ionicons name="flash" size={20} color="#3B82F6" />
                  <Text className="text-white font-medium text-sm ml-2">AI Insights</Text>
                </TouchableOpacity>
              </View>

              {/* Upcoming Sessions */}
              {upcomingSessions.length > 0 && (
                <>
                  <SectionHeader title="Upcoming Sessions" action="View All" onAction={() => router.push("/(app)/(tabs)/schedule")} />
                  {upcomingSessions.map((s) => {
                    const d = new Date(s.scheduled_at || s.start_time || s.created_at);
                    const isToday = d.toDateString() === new Date().toDateString();
                    return (
                      <Card key={s.id}>
                        <View className="flex-row items-center">
                          <View className={`rounded-xl p-2.5 mr-3 ${isToday ? "bg-primary/20" : "bg-gray-700"}`}>
                            <Ionicons name="calendar" size={20} color={isToday ? "#E8614D" : "#9CA3AF"} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-white font-semibold">{s.client_name || "Client"}</Text>
                            <Text className="text-gray-400 text-xs mt-0.5">
                              {isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </Text>
                          </View>
                          {isToday && <Badge text="Today" color="primary" />}
                        </View>
                      </Card>
                    );
                  })}
                </>
              )}
            </>
          ) : (
            <>
              {/* Client: original layout */}
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
                <TouchableOpacity
                  onPress={() => router.push("/(app)/(tabs)/nutrition")}
                  className="flex-1 bg-dark-card rounded-2xl p-4 border border-gray-700"
                >
                  <Ionicons name="restaurant" size={28} color="#F59E0B" />
                  <Text className="text-white font-semibold mt-2">Log Meal</Text>
                </TouchableOpacity>
              </View>

              {/* Client: secondary actions */}
              <View className="flex-row mb-2 gap-2">
                <TouchableOpacity
                  onPress={() => router.push("/(app)/calendar")}
                  className="flex-1 bg-dark-card rounded-2xl p-3 border border-gray-700 flex-row items-center"
                >
                  <Ionicons name="calendar" size={20} color="#3B82F6" />
                  <Text className="text-white font-medium text-sm ml-2">Calendar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/(app)/insights")}
                  className="flex-1 bg-dark-card rounded-2xl p-3 border border-gray-700 flex-row items-center"
                >
                  <Ionicons name="flash" size={20} color="#A855F7" />
                  <Text className="text-white font-medium text-sm ml-2">AI Insights</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row mb-2 gap-2">
                <TouchableOpacity
                  onPress={() => router.push("/(app)/health-sync")}
                  className="flex-1 bg-dark-card rounded-2xl p-3 border border-gray-700 flex-row items-center"
                >
                  <Ionicons name="heart" size={20} color="#EF4444" />
                  <Text className="text-white font-medium text-sm ml-2">Health Sync</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/(app)/(tabs)/progress")}
                  className="flex-1 bg-dark-card rounded-2xl p-3 border border-gray-700 flex-row items-center"
                >
                  <Ionicons name="body" size={20} color="#10B981" />
                  <Text className="text-white font-medium text-sm ml-2">Progress</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Health Summary */}
          {healthSummary && (healthSummary.steps?.value || healthSummary.calories_burned?.value) && (
            <>
              <SectionHeader title="Today's Health" action="Details" onAction={() => router.push("/(app)/health-sync")} />
              <View className="flex-row mb-2">
                <StatCard
                  label="Steps"
                  value={healthSummary.steps?.value ? Math.round(healthSummary.steps.value).toLocaleString() : "—"}
                  icon="footsteps"
                  color="#3B82F6"
                />
                <StatCard
                  label="Calories"
                  value={healthSummary.calories_burned?.value ? Math.round(healthSummary.calories_burned.value).toLocaleString() : "—"}
                  unit="kcal"
                  icon="flame"
                  color="#F59E0B"
                />
                <StatCard
                  label="Heart Rate"
                  value={healthSummary.heart_rate?.value ? Math.round(healthSummary.heart_rate.value) : "—"}
                  unit="bpm"
                  icon="heart"
                  color="#EF4444"
                />
              </View>
            </>
          )}

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
              <SectionHeader title="Insights" action="View All" onAction={() => router.push("/(app)/insights")} />
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
              <SectionHeader title="Recent Activity" action="View All" onAction={() => router.push("/(app)/notifications")} />
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
