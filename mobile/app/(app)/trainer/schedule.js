import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, Badge, Button, SectionHeader, EmptyState } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatTime } from "../../../lib/format";

export default function ScheduleScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [pending, setPending] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [tab, setTab] = useState("pending");

  const loadData = useCallback(async () => {
    try {
      const [sessData, availData] = await Promise.all([
        api("/scheduling/sessions?limit=50"),
        api("/scheduling/availability"),
      ]);
      const all = sessData.data || [];
      setPending(all.filter((s) => s.status === "requested"));
      setSessions(all.filter((s) => s.status !== "requested"));
      setAvailability(availData);
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const approveSession = async (id) => {
    try {
      await api(`/scheduling/sessions/${id}/approve`, { method: "PUT" });
      await loadData();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const declineSession = async (id) => {
    Alert.alert("Decline Session", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/scheduling/sessions/${id}/decline`, { method: "PUT", body: { reason: "Schedule conflict" } });
            await loadData();
          } catch {}
        },
      },
    ]);
  };

  const statusColors = { approved: "green", completed: "blue", cancelled: "red", declined: "gray", requested: "yellow" };
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-5 pt-2">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Schedule</Text>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row mb-4 bg-dark-card rounded-xl p-1">
          {[
            { key: "pending", label: `Pending (${pending.length})` },
            { key: "sessions", label: "Sessions" },
            { key: "availability", label: "Hours" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg items-center ${tab === t.key ? "bg-primary" : ""}`}
            >
              <Text className={`text-xs font-semibold ${tab === t.key ? "text-white" : "text-gray-400"}`}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === "pending" && (
        <FlatList
          data={pending}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <Card>
              <Text className="text-white font-semibold">{item.title}</Text>
              <Text className="text-gray-400 text-xs mt-1">
                {formatDate(item.scheduled_start)} at {formatTime(item.scheduled_start)}
              </Text>
              {item.notes && <Text className="text-gray-500 text-xs mt-1">{item.notes}</Text>}
              <View className="flex-row mt-3">
                <Button title="Approve" onPress={() => approveSession(item.id)} className="flex-1 mr-2" />
                <Button title="Decline" variant="danger" onPress={() => declineSession(item.id)} className="flex-1" />
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState icon="checkmark-circle-outline" title="All caught up" message="No pending requests" />
          }
        />
      )}

      {tab === "sessions" && (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <Card>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white font-semibold">{item.title}</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">
                    {formatDate(item.scheduled_start)} {formatTime(item.scheduled_start)}
                  </Text>
                </View>
                <Badge text={item.status} color={statusColors[item.status] || "gray"} />
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title="No sessions" message="Sessions will appear here when booked" />
          }
        />
      )}

      {tab === "availability" && (
        <View className="px-5">
          {availability.length === 0 ? (
            <EmptyState icon="time-outline" title="No availability set" message="Set your weekly availability hours" />
          ) : (
            availability.map((slot) => (
              <Card key={slot.id}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-white font-semibold">{dayNames[slot.day_of_week]}</Text>
                  <Text className="text-gray-300">{slot.start_time} - {slot.end_time}</Text>
                </View>
              </Card>
            ))
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
