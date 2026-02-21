import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import { Card, PullToRefresh, EmptyState } from "../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const TYPE_ICONS = {
  "session.requested": { icon: "calendar", color: "#3B82F6" },
  "session.approved": { icon: "checkmark-circle", color: "#10B981" },
  "session.declined": { icon: "close-circle", color: "#EF4444" },
  "workout.assigned": { icon: "barbell", color: "#E8614D" },
  "workout.completed": { icon: "trophy", color: "#10B981" },
  "personal_record": { icon: "star", color: "#F59E0B" },
  "insight.generated": { icon: "flash", color: "#A855F7" },
};

const DEFAULT_ICON = { icon: "notifications", color: "#6B7280" };

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await api("/notifications?limit=50");
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const markRead = async (id) => {
    try {
      await api(`/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api("/notifications/read-all", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {}
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <PullToRefresh onRefresh={loadNotifications}>
        <View className="px-5 pb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between mt-2 mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-row items-center">
              <Text className="text-white text-xl font-bold">Notifications</Text>
              {unreadCount > 0 && (
                <View className="bg-primary rounded-full ml-2 px-2 py-0.5">
                  <Text className="text-white text-xs font-bold">{unreadCount}</Text>
                </View>
              )}
            </View>
            {unreadCount > 0 ? (
              <TouchableOpacity onPress={markAllRead}>
                <Text className="text-primary text-sm">Read all</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 50 }} />
            )}
          </View>

          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#E8614D" />
            </View>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon="notifications-off-outline"
              title="All caught up!"
              message="No notifications yet"
            />
          ) : (
            notifications.map((n) => {
              const style = TYPE_ICONS[n.type] || DEFAULT_ICON;
              return (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => !n.is_read && markRead(n.id)}
                  activeOpacity={0.7}
                >
                  <Card className={`${!n.is_read ? "border border-gray-600" : ""} ${n.is_read ? "opacity-60" : ""}`}>
                    <View className="flex-row items-start">
                      <View style={{ backgroundColor: style.color + "20" }} className="rounded-xl p-2 mr-3">
                        <Ionicons name={style.icon} size={18} color={style.color} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className={`text-sm font-semibold flex-1 ${n.is_read ? "text-gray-400" : "text-white"}`}>
                            {n.title}
                          </Text>
                          <Text className="text-gray-600 text-xs ml-2">{formatDate(n.created_at)}</Text>
                        </View>
                        {n.body && (
                          <Text className="text-gray-400 text-xs mt-1" numberOfLines={2}>{n.body}</Text>
                        )}
                      </View>
                      {!n.is_read && <View className="w-2.5 h-2.5 rounded-full bg-primary ml-2 mt-1" />}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </PullToRefresh>
    </SafeAreaView>
  );
}
