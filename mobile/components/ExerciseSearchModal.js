import { View, Text, TouchableOpacity, FlatList, Modal, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Input } from "./ui";
import { Ionicons } from "@expo/vector-icons";
import ExerciseThumbnail from "./ExerciseThumbnail";

export default function ExerciseSearchModal({ visible, onSelect, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState("");

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setSearch("");
      setFilterGroup("");
      api("/exercises?limit=2000")
        .then((d) => setExercises(Array.isArray(d) ? d : d.data || []))
        .catch(() => setExercises([]))
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const muscleGroups = [...new Set(exercises.map((ex) => ex.muscle_group).filter(Boolean))].sort();

  const filtered = exercises.filter((ex) => {
    const matchesSearch =
      !search ||
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      (ex.muscle_group || "").toLowerCase().includes(search.toLowerCase()) ||
      (ex.equipment || "").toLowerCase().includes(search.toLowerCase());
    const matchesGroup = !filterGroup || ex.muscle_group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-dark/95">
        <View className="flex-1 bg-dark mt-12 rounded-t-3xl border-t border-gray-700">
          {/* Header */}
          <View className="px-5 pt-5 pb-3">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">Choose Exercise</Text>
              <TouchableOpacity onPress={onClose} className="bg-dark-card rounded-full p-2">
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Input
              placeholder="Search by name, muscle group, or equipment..."
              value={search}
              onChangeText={setSearch}
              icon="search-outline"
              autoFocus
            />

            {/* Muscle group filters */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ key: "", label: "All" }, ...muscleGroups.map((g) => ({ key: g, label: g }))]}
              keyExtractor={(item) => item.key}
              className="mt-3"
              contentContainerStyle={{ gap: 6 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setFilterGroup(filterGroup === item.key ? "" : item.key)}
                  className={`px-3 py-1.5 rounded-full ${
                    filterGroup === item.key || (!filterGroup && !item.key) ? "bg-primary" : "bg-dark-card"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold capitalize ${
                      filterGroup === item.key || (!filterGroup && !item.key) ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Results count */}
          {!loading && filtered.length > 0 && (
            <Text className="text-gray-500 text-xs px-5 mb-2">{filtered.length} exercises</Text>
          )}

          {/* Exercise list */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#E8614D" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onSelect(item.id)}
                  className="flex-row items-center mb-2 rounded-xl overflow-hidden"
                  style={{ backgroundColor: "rgba(42, 42, 62, 0.8)" }}
                  activeOpacity={0.7}
                >
                  {/* Color banner / thumbnail */}
                  <ExerciseThumbnail photoUrl={item.photo_url} muscleGroup={item.muscle_group} size={56} borderRadius={0} />
                  {/* Info */}
                  <View className="flex-1 px-3 py-2">
                    <Text className="text-white text-sm font-medium" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-gray-500 text-xs capitalize" numberOfLines={1}>
                      {item.muscle_group}
                      {item.equipment ? ` · ${item.equipment}` : ""}
                    </Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color="#E8614D" style={{ marginRight: 12 }} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="items-center py-12">
                  <Ionicons name="search-outline" size={40} color="#6B7280" />
                  <Text className="text-gray-400 text-sm mt-3">No exercises found</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
