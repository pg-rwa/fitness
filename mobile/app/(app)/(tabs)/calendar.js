import { View, Text, TouchableOpacity } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, PullToRefresh, Badge, EmptyState } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const EVENT_COLORS = {
  workout_session: { color: "#E8614D", icon: "barbell", label: "Workout" },
  assigned_workout: { color: "#3B82F6", icon: "clipboard", label: "Assigned" },
  measurement: { color: "#10B981", icon: "body", label: "Measurement" },
  progress_photo: { color: "#A855F7", icon: "camera", label: "Photo" },
  scheduled_session: { color: "#F59E0B", icon: "calendar", label: "Session" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date().toISOString().split("T")[0];

  const loadEvents = useCallback(async () => {
    try {
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const data = await api(`/calendar?start=${start}&end=${end}`);
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
    }
  }, [year, month]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventsForDate = (dateStr) => events.filter((e) => e.datetime && e.datetime.startsWith(dateStr));

  const navigate = (dir) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedEvents = eventsForDate(selectedDate);

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <PullToRefresh onRefresh={loadEvents}>
        <View className="px-5 pb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between mt-2 mb-4">
            <Text className="text-white text-2xl font-bold">Calendar</Text>
            <TouchableOpacity
              onPress={() => {
                setCurrentDate(new Date());
                setSelectedDate(today);
              }}
            >
              <Text className="text-primary text-sm font-semibold">Today</Text>
            </TouchableOpacity>
          </View>

          {/* Month navigation */}
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity onPress={() => navigate(-1)} className="p-2">
              <Ionicons name="chevron-back" size={22} color="#9CA3AF" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">
              {MONTHS[month]} {year}
            </Text>
            <TouchableOpacity onPress={() => navigate(1)} className="p-2">
              <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View className="flex-row mb-1">
            {DAYS.map((d) => (
              <View key={d} className="flex-1 items-center">
                <Text className="text-gray-500 text-xs font-medium">{d}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View className="flex-row flex-wrap">
            {cells.map((day, i) => {
              if (!day) return <View key={`e-${i}`} style={{ width: "14.28%", height: 48 }} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = eventsForDate(dateStr);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;

              return (
                <TouchableOpacity
                  key={dateStr}
                  onPress={() => setSelectedDate(dateStr)}
                  style={{ width: "14.28%", height: 48 }}
                  className="items-center justify-center"
                >
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center ${
                      isSelected ? "bg-primary" : isToday ? "bg-dark-card border border-gray-600" : ""
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? "text-white" : isToday ? "text-primary" : "text-gray-300"
                      }`}
                    >
                      {day}
                    </Text>
                  </View>
                  {dayEvents.length > 0 && (
                    <View className="flex-row gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((e, j) => (
                        <View
                          key={j}
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: EVENT_COLORS[e.type]?.color || "#6B7280",
                          }}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View className="flex-row flex-wrap mt-3 mb-2 gap-3">
            {Object.entries(EVENT_COLORS).map(([key, val]) => (
              <View key={key} className="flex-row items-center">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: val.color, marginRight: 4 }} />
                <Text className="text-gray-400 text-xs">{val.label}</Text>
              </View>
            ))}
          </View>

          {/* Selected day events */}
          <View className="mt-3">
            <Text className="text-white font-semibold mb-2">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>

            {selectedEvents.length === 0 ? (
              <Card className="items-center py-6">
                <Ionicons name="calendar-outline" size={32} color="#6B7280" />
                <Text className="text-gray-400 text-sm mt-2">No events on this day</Text>
              </Card>
            ) : (
              selectedEvents.map((e, i) => {
                const style = EVENT_COLORS[e.type] || { color: "#6B7280", icon: "ellipse", label: e.type };
                return (
                  <Card key={i}>
                    <View className="flex-row items-center">
                      <View style={{ backgroundColor: style.color + "30" }} className="rounded-xl p-2.5 mr-3">
                        <Ionicons name={style.icon} size={20} color={style.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold">{e.title}</Text>
                        <View className="flex-row items-center mt-1 gap-2">
                          <Text style={{ color: style.color }} className="text-xs">
                            {style.label}
                          </Text>
                          {e.datetime && <Text className="text-gray-500 text-xs">{formatTime(e.datetime)}</Text>}
                          {e.status && (
                            <Badge
                              text={e.status}
                              color={e.status === "completed" ? "green" : e.status === "scheduled" ? "blue" : "gray"}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        </View>
      </PullToRefresh>
    </SafeAreaView>
  );
}
