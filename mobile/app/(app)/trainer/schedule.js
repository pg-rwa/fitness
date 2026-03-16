import { View, Text, FlatList, TouchableOpacity, Alert, Modal, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, Badge, Button, Input, EmptyState, LoadingScreen } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatTime } from "../../../lib/format";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_COLORS = { approved: "green", completed: "blue", cancelled: "red", declined: "gray", requested: "yellow", proposed: "primary" };

export default function ScheduleScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [pending, setPending] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotForm, setSlotForm] = useState({ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" });
  const [savingSlots, setSavingSlots] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sessData, availData] = await Promise.all([
        api("/scheduling/sessions?limit=50"),
        api("/scheduling/availability"),
      ]);
      const all = sessData.data || sessData || [];
      setPending(all.filter((s) => s.status === "requested" || s.status === "proposed"));
      setSessions(all.filter((s) => s.status !== "requested" && s.status !== "proposed"));
      setAvailability(Array.isArray(availData) ? availData : []);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const approveSession = async (id) => {
    try {
      await api(`/scheduling/sessions/${id}/approve`, { method: "PUT" });
      await loadData();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const declineSession = async (id) => {
    Alert.alert("Decline Session", "Are you sure you want to decline?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/scheduling/sessions/${id}/decline`, { method: "PUT", body: { reason: "Schedule conflict" } });
            await loadData();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const completeSession = async (id) => {
    try {
      await api(`/scheduling/sessions/${id}/complete`, { method: "PUT" });
      await loadData();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const cancelSession = async (id) => {
    Alert.alert("Cancel Session", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/scheduling/sessions/${id}/cancel`, { method: "PUT" });
            await loadData();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const addAvailabilitySlot = async () => {
    setSavingSlots(true);
    try {
      const newSlots = [
        ...availability.map((s) => ({
          dayOfWeek: s.day_of_week,
          startTime: s.start_time,
          endTime: s.end_time,
        })),
        slotForm,
      ];
      await api("/scheduling/availability", { method: "PUT", body: { slots: newSlots } });
      setShowAddSlot(false);
      await loadData();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSavingSlots(false);
    }
  };

  const removeAvailabilitySlot = (slotToRemove) => {
    Alert.alert("Remove Slot", `Remove ${DAY_SHORT[slotToRemove.day_of_week]} ${slotToRemove.start_time}-${slotToRemove.end_time}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const remaining = availability
              .filter((s) => s.id !== slotToRemove.id)
              .map((s) => ({
                dayOfWeek: s.day_of_week,
                startTime: s.start_time,
                endTime: s.end_time,
              }));
            if (remaining.length === 0) {
              // API requires at least 1 slot, so we inform the user
              Alert.alert("Cannot Remove", "You must have at least one availability slot. Edit it instead.");
              return;
            }
            await api("/scheduling/availability", { method: "PUT", body: { slots: remaining } });
            await loadData();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const updateSlotForm = (key) => (val) => setSlotForm((prev) => ({ ...prev, [key]: val }));

  if (loading) return <LoadingScreen />;

  const renderPendingItem = ({ item }) => (
    <Card>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-white font-semibold flex-1">{item.title}</Text>
        <Badge text={item.status} color={STATUS_COLORS[item.status] || "gray"} />
      </View>
      {item.client_name && (
        <Text className="text-primary text-xs mb-1">Client: {item.client_name}</Text>
      )}
      <Text className="text-gray-400 text-xs">
        {formatDate(item.scheduled_start)} at {formatTime(item.scheduled_start)}
        {item.scheduled_end ? ` - ${formatTime(item.scheduled_end)}` : ""}
      </Text>
      {item.location && <Text className="text-gray-500 text-xs mt-1">{item.location}</Text>}
      {item.notes && <Text className="text-gray-500 text-xs mt-1">{item.notes}</Text>}
      <View className="flex-row mt-3">
        <TouchableOpacity
          onPress={() => approveSession(item.id)}
          className="flex-1 bg-green-600 rounded-xl py-2.5 items-center mr-2"
        >
          <Text className="text-white font-semibold text-sm">Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => declineSession(item.id)}
          className="flex-1 bg-red-600/20 rounded-xl py-2.5 items-center"
        >
          <Text className="text-red-400 font-semibold text-sm">Decline</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderSessionItem = ({ item }) => (
    <Card>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-white font-semibold">{item.title}</Text>
          {item.client_name && (
            <Text className="text-primary text-xs mt-0.5">Client: {item.client_name}</Text>
          )}
          <Text className="text-gray-400 text-xs mt-0.5">
            {formatDate(item.scheduled_start)} {formatTime(item.scheduled_start)}
            {item.scheduled_end ? ` - ${formatTime(item.scheduled_end)}` : ""}
          </Text>
          {item.location && <Text className="text-gray-500 text-xs mt-0.5">{item.location}</Text>}
        </View>
        <View className="items-end">
          <Badge text={item.status} color={STATUS_COLORS[item.status] || "gray"} />
          {item.status === "approved" && (
            <View className="flex-row mt-2">
              <TouchableOpacity onPress={() => completeSession(item.id)} className="bg-green-500/20 rounded-lg px-2 py-1 mr-1">
                <Text className="text-green-400 text-xs font-semibold">Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => cancelSession(item.id)} className="bg-red-500/20 rounded-lg px-2 py-1">
                <Text className="text-red-400 text-xs font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Card>
  );

  // Sort availability by day of week
  const sortedAvailability = [...availability].sort((a, b) => a.day_of_week - b.day_of_week);

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
            { key: "pending", label: `Pending${pending.length ? ` (${pending.length})` : ""}` },
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8614D" />}
          renderItem={renderPendingItem}
          ListEmptyComponent={
            <EmptyState icon="checkmark-circle-outline" title="All caught up" message="No pending session requests" />
          }
        />
      )}

      {tab === "sessions" && (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8614D" />}
          renderItem={renderSessionItem}
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title="No sessions" message="Sessions will appear here when booked" />
          }
        />
      )}

      {tab === "availability" && (
        <ScrollView
          className="flex-1 px-5"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8614D" />}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-400 text-sm">Your weekly availability</Text>
            <TouchableOpacity onPress={() => setShowAddSlot(true)} className="bg-primary rounded-xl px-4 py-2">
              <Text className="text-white font-semibold text-sm">+ Add Slot</Text>
            </TouchableOpacity>
          </View>

          {sortedAvailability.length === 0 ? (
            <EmptyState icon="time-outline" title="No availability set" message="Add your weekly hours so clients can book sessions" />
          ) : (
            sortedAvailability.map((slot) => (
              <Card key={slot.id || `${slot.day_of_week}-${slot.start_time}`}>
                <View className="flex-row items-center">
                  <View className="bg-yellow-500/20 rounded-xl p-2.5 mr-3">
                    <Ionicons name="time-outline" size={20} color="#F59E0B" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{DAY_NAMES[slot.day_of_week]}</Text>
                    <Text className="text-gray-400 text-sm">{slot.start_time} - {slot.end_time}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeAvailabilitySlot(slot)} className="p-2">
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Availability Slot Modal */}
      <Modal visible={showAddSlot} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-dark-card rounded-t-3xl p-5 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-bold">Add Availability</Text>
              <TouchableOpacity onPress={() => setShowAddSlot(false)}>
                <Ionicons name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-400 text-sm mb-2 ml-1">Day of Week</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row">
                {DAY_SHORT.map((day, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => updateSlotForm("dayOfWeek")(idx)}
                    className={`px-4 py-2.5 rounded-lg mr-2 ${slotForm.dayOfWeek === idx ? "bg-primary" : "bg-dark"}`}
                  >
                    <Text className={`text-sm font-semibold ${slotForm.dayOfWeek === idx ? "text-white" : "text-gray-400"}`}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View className="flex-row">
              <View className="flex-1 mr-2">
                <Input label="Start Time" value={slotForm.startTime} onChangeText={updateSlotForm("startTime")} placeholder="09:00" />
              </View>
              <View className="flex-1 ml-2">
                <Input label="End Time" value={slotForm.endTime} onChangeText={updateSlotForm("endTime")} placeholder="17:00" />
              </View>
            </View>

            <Button title="Add Slot" onPress={addAvailabilitySlot} loading={savingSlots} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
