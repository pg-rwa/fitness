import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import { Card, Button, PullToRefresh, Badge, EmptyState } from "../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const INSIGHT_ICONS = {
  trend: { icon: "trending-up", color: "#3B82F6" },
  habit: { icon: "flame", color: "#10B981" },
  tip: { icon: "bulb", color: "#F59E0B" },
  milestone: { icon: "trophy", color: "#E8614D" },
  warning: { icon: "warning", color: "#EF4444" },
  recommendation: { icon: "clipboard", color: "#A855F7" },
};

export default function InsightsScreen() {
  const router = useRouter();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadInsights = useCallback(async () => {
    try {
      const data = await api("/insights?limit=20");
      setInsights(data.data || []);
    } catch {
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInsights(); }, [loadInsights]);

  const generate = async () => {
    setGenerating(true);
    try {
      const newInsights = await api("/insights/generate", { method: "POST" });
      if (Array.isArray(newInsights)) {
        setInsights((prev) => [...newInsights, ...prev]);
      }
    } catch {}
    setGenerating(false);
  };

  const markRead = async (id) => {
    try {
      await api(`/insights/${id}/read`, { method: "PUT" });
      setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, is_read: 1 } : i)));
    } catch {}
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <PullToRefresh onRefresh={loadInsights}>
        <View className="px-5 pb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between mt-2 mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">AI Insights</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text className="text-gray-400 text-sm mb-4">Personalized analysis of your fitness journey</Text>

          {/* Generate button */}
          <Button
            title={generating ? "Analyzing..." : "Generate New Insights"}
            icon={generating ? undefined : "flash"}
            onPress={generate}
            loading={generating}
            className="mb-4"
          />

          {/* Summary badges */}
          {insights.length > 0 && (
            <View className="flex-row flex-wrap mb-3 gap-2">
              {Object.entries(
                insights.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {})
              ).map(([type, count]) => {
                const style = INSIGHT_ICONS[type] || INSIGHT_ICONS.tip;
                return (
                  <View key={type} className="flex-row items-center bg-dark-card rounded-full px-3 py-1.5">
                    <Ionicons name={style.icon} size={14} color={style.color} />
                    <Text className="text-gray-300 text-xs ml-1.5 capitalize">{count} {type}{count > 1 ? "s" : ""}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#E8614D" />
            </View>
          ) : insights.length === 0 ? (
            <EmptyState
              icon="flash-outline"
              title="No insights yet"
              message="Tap 'Generate New Insights' to get AI-powered analysis of your fitness data"
            />
          ) : (
            insights.map((insight) => {
              const style = INSIGHT_ICONS[insight.type] || INSIGHT_ICONS.tip;
              const data = typeof insight.data === "string" ? JSON.parse(insight.data) : insight.data;

              return (
                <TouchableOpacity
                  key={insight.id}
                  onPress={() => !insight.is_read && markRead(insight.id)}
                  activeOpacity={0.7}
                >
                  <Card className={!insight.is_read ? "border border-gray-600" : ""}>
                    <View className="flex-row items-start">
                      <View style={{ backgroundColor: style.color + "20" }} className="rounded-xl p-2.5 mr-3">
                        <Ionicons name={style.icon} size={22} color={style.color} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-white font-semibold flex-1">{insight.title}</Text>
                          {!insight.is_read && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </View>
                        <Text className="text-gray-400 text-sm leading-5">{insight.body}</Text>

                        {/* Data points */}
                        {data && Object.keys(data).length > 0 && (
                          <View className="flex-row flex-wrap mt-2 gap-1.5">
                            {Object.entries(data).slice(0, 4).map(([key, value]) => (
                              <View key={key} className="bg-dark rounded-lg px-2 py-1">
                                <Text className="text-gray-500 text-[10px]">
                                  {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                                </Text>
                                <Text className="text-white text-xs font-medium">
                                  {typeof value === "number" ? Math.round(value * 10) / 10 : String(value)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        <View className="flex-row items-center mt-2 gap-2">
                          <Text style={{ color: style.color }} className="text-xs capitalize">{insight.type}</Text>
                          {insight.generated_at && (
                            <Text className="text-gray-600 text-xs">{formatDate(insight.generated_at)}</Text>
                          )}
                        </View>
                      </View>
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
