import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Card, Badge, StatCard, SectionHeader, LoadingScreen } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatWeight } from "../../../lib/format";

export default function ClientDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [client, setClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api(`/users/${id}`).then(setClient).catch(() => {}),
      api(`/workout-sessions/client/${id}?limit=10`).then((d) => setSessions(d.data || [])).catch(() => {}),
      api(`/progress/measurements/client/${id}?limit=5`).then((d) => setMeasurements(d.data || [])).catch(() => {}),
      api(`/assigned-workouts/client/${id}`).then(setAssignments).catch(() => {}),
    ]);
  }, [id]);

  if (!client) return <LoadingScreen />;

  const tabs = ["overview", "workouts", "nutrition", "progress"];

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mt-2 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">{client.first_name} {client.last_name}</Text>
            <Text className="text-gray-400 text-sm">{client.email}</Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {tabs.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              className={`px-4 py-2 rounded-full mr-2 ${tab === t ? "bg-primary" : "bg-dark-card"}`}
            >
              <Text className={`text-sm font-semibold capitalize ${tab === t ? "text-white" : "text-gray-400"}`}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Overview */}
        {tab === "overview" && (
          <>
            <View className="flex-row mb-2">
              <StatCard label="Workouts" value={sessions.length} icon="barbell" />
              <StatCard label="Assigned" value={assignments.length} icon="document-text" color="#3B82F6" />
            </View>
            {measurements[0] && (
              <View className="flex-row mb-2">
                <StatCard label="Weight" value={measurements[0].weight_kg || "-"} unit="kg" icon="scale" color="#10B981" />
                <StatCard label="Body Fat" value={measurements[0].body_fat_pct || "-"} unit="%" icon="body" color="#F59E0B" />
              </View>
            )}

            <SectionHeader title="Assigned Workouts" />
            {assignments.map((a) => (
              <Card key={a.id}>
                <Text className="text-white font-semibold">{a.template_name}</Text>
                {a.notes && <Text className="text-gray-400 text-xs mt-0.5">{a.notes}</Text>}
              </Card>
            ))}
          </>
        )}

        {/* Workouts */}
        {tab === "workouts" && (
          <>
            <SectionHeader title="Recent Sessions" />
            {sessions.map((s) => (
              <Card key={s.id}>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white font-semibold">{s.name}</Text>
                    <Text className="text-gray-400 text-xs">{formatDate(s.started_at)}</Text>
                  </View>
                  <Badge text={s.ended_at ? "Done" : "Active"} color={s.ended_at ? "green" : "yellow"} />
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Progress */}
        {tab === "progress" && (
          <>
            <SectionHeader title="Measurements" />
            {measurements.map((m) => (
              <Card key={m.id}>
                <View className="flex-row justify-between">
                  <Text className="text-white font-semibold">{formatDate(m.recorded_at)}</Text>
                  <Text className="text-gray-300">{formatWeight(m.weight_kg)}</Text>
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Nutrition */}
        {tab === "nutrition" && (
          <Card>
            <Text className="text-gray-400 text-center">View client's nutrition from the web dashboard</Text>
          </Card>
        )}

        <View className="pb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
