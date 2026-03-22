import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView, Modal, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, Badge, Button, SectionHeader, EmptyState } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatTime } from "../../../lib/format";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const HOURS = [];
for (let h = 5; h <= 22; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    HOURS.push(`${hh}:${mm}`);
  }
}

function formatHour(t) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function TimePickerModal({ visible, onClose, onSelect, title, selected }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-dark-card rounded-t-3xl max-h-[60%]">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-700">
            <Text className="text-white text-lg font-bold">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={HOURS}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { onSelect(item); onClose(); }}
                className={`px-5 py-3.5 border-b border-gray-800 ${item === selected ? "bg-primary/20" : ""}`}
              >
                <Text className={`text-base ${item === selected ? "text-primary font-semibold" : "text-white"}`}>
                  {formatHour(item)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

function AvailabilityEditor({ availability, onSave, saving }) {
  // Group slots by day
  const [slots, setSlots] = useState({});
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // { day, index, field }
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const grouped = {};
    for (let d = 0; d < 7; d++) grouped[d] = [];
    availability.forEach((s) => {
      if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
      grouped[s.day_of_week].push({ start: s.start_time, end: s.end_time });
    });
    setSlots(grouped);
    setDirty(false);
  }, [availability]);

  const addSlot = (day) => {
    const daySlots = slots[day] || [];
    const lastEnd = daySlots.length > 0 ? daySlots[daySlots.length - 1].end : "09:00";
    // default 1 hour after last end
    const [h] = lastEnd.split(":").map(Number);
    const newStart = lastEnd;
    const newEnd = `${String(Math.min(h + 1, 22)).padStart(2, "0")}:00`;
    setSlots({ ...slots, [day]: [...daySlots, { start: newStart, end: newEnd }] });
    setDirty(true);
  };

  const removeSlot = (day, index) => {
    const updated = [...(slots[day] || [])];
    updated.splice(index, 1);
    setSlots({ ...slots, [day]: updated });
    setDirty(true);
  };

  const openPicker = (day, index, field) => {
    setPickerTarget({ day, index, field });
    setPickerVisible(true);
  };

  const handleTimeSelect = (time) => {
    if (!pickerTarget) return;
    const { day, index, field } = pickerTarget;
    const updated = [...(slots[day] || [])];
    updated[index] = { ...updated[index], [field]: time };
    setSlots({ ...slots, [day]: updated });
    setDirty(true);
  };

  const handleSave = () => {
    const allSlots = [];
    for (let d = 0; d < 7; d++) {
      (slots[d] || []).forEach((s) => {
        if (s.start >= s.end) return; // skip invalid
        allSlots.push({ dayOfWeek: d, startTime: s.start, endTime: s.end });
      });
    }
    onSave(allSlots);
  };

  const currentSelected = pickerTarget
    ? (slots[pickerTarget.day] || [])[pickerTarget.index]?.[pickerTarget.field]
    : null;

  return (
    <View className="flex-1">
      <TimePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleTimeSelect}
        title={pickerTarget?.field === "start" ? "Start Time" : "End Time"}
        selected={currentSelected}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        {[1, 2, 3, 4, 5, 6, 0].map((day) => (
          <View key={day} className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white font-semibold text-base">{DAY_NAMES[day]}</Text>
              <TouchableOpacity
                onPress={() => addSlot(day)}
                className="flex-row items-center bg-primary/20 rounded-lg px-3 py-1.5"
              >
                <Ionicons name="add" size={16} color="#E8614D" />
                <Text className="text-primary text-xs ml-1">Add</Text>
              </TouchableOpacity>
            </View>

            {(!slots[day] || slots[day].length === 0) ? (
              <Text className="text-gray-500 text-xs ml-1 mb-1">No availability</Text>
            ) : (
              slots[day].map((slot, i) => (
                <View key={i} className="flex-row items-center bg-dark-card rounded-xl p-3 mb-2">
                  <TouchableOpacity
                    onPress={() => openPicker(day, i, "start")}
                    className="bg-dark rounded-lg px-4 py-2.5 flex-1 mr-2"
                  >
                    <Text className="text-white text-center text-sm">{formatHour(slot.start)}</Text>
                  </TouchableOpacity>

                  <Text className="text-gray-400 mx-1">to</Text>

                  <TouchableOpacity
                    onPress={() => openPicker(day, i, "end")}
                    className="bg-dark rounded-lg px-4 py-2.5 flex-1 mx-2"
                  >
                    <Text className="text-white text-center text-sm">{formatHour(slot.end)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => removeSlot(day, i)} className="p-2">
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ))}

        {dirty && (
          <Button
            title={saving ? "Saving..." : "Save Availability"}
            onPress={handleSave}
            loading={saving}
            icon="checkmark-circle-outline"
            className="mt-2"
          />
        )}
      </ScrollView>
    </View>
  );
}

export default function TrainerScheduleScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [pending, setPending] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [tab, setTab] = useState("pending");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sessData, availData] = await Promise.all([
        api("/scheduling/sessions?limit=50"),
        api("/scheduling/availability"),
      ]);
      const all = sessData.data || [];
      setPending(all.filter((s) => s.status === "requested" || s.status === "proposed"));
      setSessions(all.filter((s) => s.status !== "requested" && s.status !== "proposed"));
      setAvailability(availData);
    } catch (err) {
      console.log("[schedule] load error:", err.message);
    }
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

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
        text: "Cancel Session",
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

  const saveAvailability = async (slots) => {
    setSaving(true);
    try {
      await api("/scheduling/availability", { method: "PUT", body: { slots } });
      Alert.alert("Saved", "Your availability has been updated");
      await loadData();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const statusColors = {
    approved: "green", completed: "blue", cancelled: "red",
    declined: "gray", requested: "yellow", proposed: "yellow",
  };

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
            { key: "pending", label: `Requests (${pending.length})` },
            { key: "sessions", label: "Sessions" },
            { key: "availability", label: "Availability" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg items-center ${tab === t.key ? "bg-primary" : ""}`}
            >
              <Text className={`text-xs font-semibold ${tab === t.key ? "text-white" : "text-gray-400"}`}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pending Requests */}
      {tab === "pending" && (
        <FlatList
          data={pending}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8614D" />}
          renderItem={({ item }) => (
            <Card>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-white font-semibold flex-1">{item.title}</Text>
                <Badge text={item.status} color={statusColors[item.status]} />
              </View>
              {item.client_name && (
                <Text className="text-primary text-xs">{item.client_name}</Text>
              )}
              <Text className="text-gray-400 text-xs mt-1">
                {formatDate(item.scheduled_start)} at {formatTime(item.scheduled_start)}
              </Text>
              {item.notes && <Text className="text-gray-500 text-xs mt-1">{item.notes}</Text>}
              {item.status === "requested" && (
                <View className="flex-row mt-3">
                  <Button title="Approve" onPress={() => approveSession(item.id)} className="flex-1 mr-2" />
                  <Button title="Decline" variant="danger" onPress={() => declineSession(item.id)} className="flex-1" />
                </View>
              )}
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState icon="checkmark-circle-outline" title="All caught up" message="No pending requests" />
          }
        />
      )}

      {/* Sessions */}
      {tab === "sessions" && (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8614D" />}
          renderItem={({ item }) => (
            <Card>
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-1">
                  <Text className="text-white font-semibold">{item.title}</Text>
                  {item.client_name && (
                    <Text className="text-primary text-xs mt-0.5">{item.client_name}</Text>
                  )}
                  <Text className="text-gray-400 text-xs mt-0.5">
                    {formatDate(item.scheduled_start)} {formatTime(item.scheduled_start)}
                  </Text>
                </View>
                <Badge text={item.status} color={statusColors[item.status] || "gray"} />
              </View>
              {item.status === "approved" && (
                <View className="flex-row mt-3">
                  <Button title="Complete" variant="secondary" onPress={() => completeSession(item.id)} className="flex-1 mr-2" icon="checkmark" />
                  <Button title="Cancel" variant="danger" onPress={() => cancelSession(item.id)} className="flex-1" icon="close" />
                </View>
              )}
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title="No sessions" message="Sessions will appear here when booked" />
          }
        />
      )}

      {/* Availability Editor */}
      {tab === "availability" && (
        <AvailabilityEditor
          availability={availability}
          onSave={saveAvailability}
          saving={saving}
        />
      )}
    </SafeAreaView>
  );
}
