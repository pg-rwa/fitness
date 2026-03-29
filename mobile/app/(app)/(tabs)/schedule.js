import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView, Modal, TextInput, RefreshControl } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import { Card, Badge, Button, EmptyState } from "../../../components/ui";
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
  const [slots, setSlots] = useState({});
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null);
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
        if (s.start >= s.end) return;
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

function getNext14Days() {
  const days = [];
  const now = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d);
  }
  return days;
}

function BookingModal({ visible, onClose, trainerId, onBooked }) {
  const [step, setStep] = useState(1); // 1=date, 2=slot, 3=details
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const dates = getNext14Days();

  const reset = () => {
    setStep(1);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    setTitle("");
    setNotes("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const selectDate = async (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const data = await api(`/scheduling/sessions/available-slots?trainerId=${trainerId}&date=${dateStr}`);
      setSlots(data || []);
      setStep(2);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoadingSlots(false);
    }
  };

  const selectSlot = (slot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const submitBooking = async () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter a session title");
      return;
    }
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      await api("/scheduling/sessions", {
        method: "POST",
        body: {
          trainerId,
          title: title.trim(),
          scheduledStart: `${dateStr}T${selectedSlot.start_time}:00`,
          scheduledEnd: `${dateStr}T${selectedSlot.end_time}:00`,
          notes: notes.trim() || undefined,
        },
      });
      Alert.alert("Requested!", "Your session request has been sent to your trainer");
      handleClose();
      onBooked();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-dark-card rounded-t-3xl max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-700">
            <View className="flex-row items-center">
              {step > 1 && (
                <TouchableOpacity onPress={() => setStep(step - 1)} className="mr-3">
                  <Ionicons name="arrow-back" size={20} color="white" />
                </TouchableOpacity>
              )}
              <Text className="text-white text-lg font-bold">
                {step === 1 ? "Pick a Date" : step === 2 ? "Pick a Time" : "Session Details"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Step 1: Date Selection */}
          {step === 1 && (
            <FlatList
              data={dates}
              keyExtractor={(item) => item.toISOString()}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, paddingBottom: 40 }}
              renderItem={({ item }) => {
                const isSelected = selectedDate?.toDateString() === item.toDateString();
                return (
                  <TouchableOpacity
                    onPress={() => selectDate(item)}
                    className={`flex-row items-center justify-between p-4 mb-2 rounded-xl ${isSelected ? "bg-primary/20 border border-primary" : "bg-dark"}`}
                  >
                    <View>
                      <Text className="text-white font-semibold">{DAY_NAMES[item.getDay()]}</Text>
                      <Text className="text-gray-400 text-sm">
                        {item.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Step 2: Slot Selection */}
          {step === 2 && (
            <View className="px-5 py-4">
              <Text className="text-gray-400 text-sm mb-3">
                {selectedDate && DAY_NAMES[selectedDate.getDay()]},{" "}
                {selectedDate?.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </Text>

              {loadingSlots ? (
                <View className="items-center py-8">
                  <Text className="text-gray-400">Loading available slots...</Text>
                </View>
              ) : slots.length === 0 ? (
                <EmptyState
                  icon="calendar-outline"
                  title="No slots available"
                  message="Your trainer has no availability on this date. Try a different day."
                />
              ) : (
                <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingBottom: 40 }}>
                  {slots.map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      onPress={() => selectSlot(slot)}
                      className="flex-row items-center justify-between p-4 mb-2 rounded-xl bg-dark"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={20} color="#E8614D" />
                        <Text className="text-white font-semibold ml-3">
                          {formatHour(slot.start_time)} - {formatHour(slot.end_time)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <ScrollView className="px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
              <Text className="text-gray-400 text-sm mb-1">
                {selectedDate && DAY_NAMES[selectedDate.getDay()]},{" "}
                {selectedDate?.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </Text>
              <Text className="text-white font-semibold mb-4">
                {selectedSlot && `${formatHour(selectedSlot.start_time)} - ${formatHour(selectedSlot.end_time)}`}
              </Text>

              <Text className="text-gray-400 text-sm mb-1.5 ml-1">Session Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Upper Body Workout"
                placeholderTextColor="#6B7280"
                className="bg-dark rounded-xl px-4 py-3.5 text-white text-base mb-4 border border-transparent"
              />

              <Text className="text-gray-400 text-sm mb-1.5 ml-1">Notes (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special requests or notes..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-dark rounded-xl px-4 py-3.5 text-white text-base mb-6 border border-transparent"
                style={{ minHeight: 80 }}
              />

              <Button
                title={loading ? "Sending Request..." : "Request Session"}
                onPress={submitBooking}
                loading={loading}
                icon="send-outline"
              />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function ScheduleTab() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [pending, setPending] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [tab, setTab] = useState("pending");
  const [showBooking, setShowBooking] = useState(false);

  const isTrainer = user?.role === "trainer";
  const trainerId = user?.trainer_id;
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const promises = [api("/scheduling/sessions?limit=50")];
      // Trainers see their own availability, clients see their trainer's
      if (isTrainer) {
        promises.push(api("/scheduling/availability"));
      } else if (trainerId) {
        promises.push(api(`/scheduling/availability/${trainerId}`));
      } else {
        promises.push(Promise.resolve([]));
      }

      const [sessData, availData] = await Promise.all(promises);
      const all = sessData.data || [];
      setPending(all.filter((s) => s.status === "requested" || s.status === "proposed"));
      setSessions(all.filter((s) => s.status !== "requested" && s.status !== "proposed"));
      setAvailability(availData);
    } catch (err) {
      __DEV__ && console.log("[schedule] load error:", err.message);
    }
  }, [isTrainer, trainerId]);

  // Reload data when screen comes into focus
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

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
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
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

  const acceptProposal = async (id) => {
    try {
      await api(`/scheduling/sessions/${id}/accept-proposal`, { method: "PUT" });
      await loadData();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const declineProposal = async (id) => {
    Alert.alert("Decline Proposal", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/scheduling/sessions/${id}/decline-proposal`, { method: "PUT" });
            await loadData();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const statusColors = {
    approved: "green", completed: "blue", cancelled: "red",
    declined: "gray", requested: "yellow", proposed: "yellow",
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-5 pt-2">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-2xl font-bold">Schedule</Text>
          {!isTrainer && trainerId && (
            <TouchableOpacity
              onPress={() => setShowBooking(true)}
              className="flex-row items-center bg-primary rounded-xl px-4 py-2.5"
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-semibold text-sm ml-1">Book</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Switcher */}
        <View className="flex-row mb-4 bg-dark-card rounded-xl p-1">
          {[
            { key: "pending", label: `Requests (${pending.length})` },
            { key: "sessions", label: "Sessions" },
            { key: "availability", label: isTrainer ? "My Availability" : "Trainer Hours" },
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

      {/* Booking Modal */}
      {!isTrainer && trainerId && (
        <BookingModal
          visible={showBooking}
          onClose={() => setShowBooking(false)}
          trainerId={trainerId}
          onBooked={loadData}
        />
      )}

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
              <Text className="text-gray-400 text-xs mt-1">
                {formatDate(item.scheduled_start)} at {formatTime(item.scheduled_start)}
              </Text>
              {item.notes && <Text className="text-gray-500 text-xs mt-1">{item.notes}</Text>}

              {/* Trainer actions for requested sessions */}
              {isTrainer && item.status === "requested" && (
                <View className="flex-row mt-3">
                  <Button title="Approve" onPress={() => approveSession(item.id)} className="flex-1 mr-2" />
                  <Button title="Decline" variant="danger" onPress={() => declineSession(item.id)} className="flex-1" />
                </View>
              )}

              {/* Client actions for proposed sessions */}
              {!isTrainer && item.status === "proposed" && (
                <View className="mt-2">
                  {item.decline_reason && (
                    <Text className="text-yellow-400 text-xs mb-2">Trainer proposed a new time: {item.decline_reason}</Text>
                  )}
                  <View className="flex-row">
                    <Button title="Accept" onPress={() => acceptProposal(item.id)} className="flex-1 mr-2" />
                    <Button title="Decline" variant="danger" onPress={() => declineProposal(item.id)} className="flex-1" />
                  </View>
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
                  <Text className="text-gray-400 text-xs mt-0.5">
                    {formatDate(item.scheduled_start)} {formatTime(item.scheduled_start)}
                  </Text>
                </View>
                <Badge text={item.status} color={statusColors[item.status] || "gray"} />
              </View>
              {item.status === "approved" && (
                <View className="flex-row mt-3">
                  <Button title="Cancel" variant="danger" onPress={() => cancelSession(item.id)} className="flex-1" icon="close" />
                </View>
              )}
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title="No sessions" message={
              !isTrainer && trainerId
                ? "Tap 'Book' to request a session with your trainer"
                : "Sessions will appear here when booked"
            } />
          }
        />
      )}

      {/* Availability — editable for trainers, read-only for clients */}
      {tab === "availability" && (
        isTrainer ? (
          <AvailabilityEditor
            availability={availability}
            onSave={saveAvailability}
            saving={saving}
          />
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8614D" />}>
            {!trainerId ? (
              <EmptyState icon="person-outline" title="No trainer assigned" message="You need an assigned trainer to see availability" />
            ) : availability.length === 0 ? (
              <EmptyState icon="time-outline" title="No availability set" message="Your trainer hasn't set availability yet" />
            ) : (
              [1, 2, 3, 4, 5, 6, 0].map((day) => {
                const daySlots = availability.filter((s) => s.day_of_week === day);
                if (daySlots.length === 0) return null;
                return (
                  <View key={day} className="mb-3">
                    <Text className="text-gray-400 text-xs font-semibold uppercase mb-1.5 ml-1">{DAY_NAMES[day]}</Text>
                    {daySlots.map((slot) => (
                      <Card key={slot.id}>
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={18} color="#E8614D" />
                          <Text className="text-white ml-3">
                            {formatHour(slot.start_time)} - {formatHour(slot.end_time)}
                          </Text>
                        </View>
                      </Card>
                    ))}
                  </View>
                );
              })
            )}
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}
