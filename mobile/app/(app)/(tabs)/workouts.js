import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, Badge, Button, EmptyState, SectionHeader } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatDuration } from "../../../lib/format";

export default function WorkoutsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [tab, setTab] = useState("history");

  const loadData = useCallback(async () => {
    try {
      const [sessData, tplData] = await Promise.all([
        api("/workout-sessions?limit=20"),
        api("/workout-templates?limit=50"),
      ]);
      setSessions(sessData.data || []);
      setTemplates(tplData.data || []);
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const renderSession = ({ item }) => (
    <Card onPress={() => router.push(`/(app)/workout/${item.id}`)}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">{item.name}</Text>
          <Text className="text-gray-400 text-xs mt-1">{formatDate(item.started_at)}</Text>
          {item.total_volume > 0 && (
            <Text className="text-gray-400 text-xs">
              Volume: {Math.round(item.total_volume).toLocaleString()} kg
            </Text>
          )}
        </View>
        <View className="items-end">
          <Badge
            text={item.ended_at ? "Completed" : "In Progress"}
            color={item.ended_at ? "green" : "yellow"}
          />
          {item.ended_at && (
            <Text className="text-gray-500 text-xs mt-1">{formatDuration(item.started_at, item.ended_at)}</Text>
          )}
        </View>
      </View>
    </Card>
  );

  const renderTemplate = ({ item }) => (
    <Card onPress={() => router.push(`/(app)/workout/start?templateId=${item.id}`)}>
      <View className="flex-row items-center">
        <View className="bg-primary/20 rounded-xl p-2.5 mr-3">
          <Ionicons name="document-text" size={22} color="#E8614D" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold">{item.name}</Text>
          {item.description && <Text className="text-gray-400 text-xs mt-0.5">{item.description}</Text>}
          <View className="flex-row mt-1">
            {item.difficulty && <Badge text={item.difficulty} color="blue" className="mr-2" />}
            {item.estimated_duration_min && (
              <Text className="text-gray-500 text-xs self-center">{item.estimated_duration_min} min</Text>
            )}
          </View>
        </View>
        <Ionicons name="play-circle" size={28} color="#E8614D" />
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-5 pt-2">
        <Text className="text-white text-2xl font-bold">Workouts</Text>

        {/* Tab Switcher */}
        <View className="flex-row mt-4 mb-4 bg-dark-card rounded-xl p-1">
          {[{ key: "history", label: "History" }, { key: "templates", label: "Templates" }].map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg items-center ${tab === t.key ? "bg-primary" : ""}`}
            >
              <Text className={`font-semibold ${tab === t.key ? "text-white" : "text-gray-400"}`}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === "history" ? (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          ListHeaderComponent={
            <Button
              title="Start Blank Workout"
              icon="add-circle"
              onPress={() => router.push("/(app)/workout/start")}
              className="mb-4"
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="barbell-outline"
              title="No workouts yet"
              message="Start your first workout to begin tracking"
            />
          }
        />
      ) : (
        <FlatList
          data={templates}
          renderItem={renderTemplate}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No templates"
              message="Ask your trainer to create workout templates for you"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
