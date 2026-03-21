import { View, Text, FlatList, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, Badge, EmptyState } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const MUSCLE_GROUPS = [
  "All", "chest", "back", "shoulders", "biceps", "triceps", "forearms",
  "quadriceps", "hamstrings", "glutes", "calves", "core", "full_body",
];

const CATEGORIES = [
  "All", "strength", "cardio", "flexibility", "balance", "plyometric",
];

export default function ExercisesScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  const loadExercises = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api("/exercises");
      const list = Array.isArray(data) ? data : data.data || [];
      setExercises(list);
      setFiltered(list);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadExercises(); }, [loadExercises]);

  useEffect(() => {
    let result = exercises;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) => e.name?.toLowerCase().includes(q) || e.muscle_group?.toLowerCase().includes(q)
      );
    }
    if (selectedMuscle !== "All") {
      result = result.filter((e) => e.muscle_group === selectedMuscle);
    }
    if (selectedCategory !== "All") {
      result = result.filter((e) => e.category === selectedCategory);
    }
    setFiltered(result);
  }, [search, selectedMuscle, selectedCategory, exercises]);

  const muscleColor = {
    chest: "#EF4444", back: "#3B82F6", shoulders: "#F59E0B", biceps: "#10B981",
    triceps: "#8B5CF6", forearms: "#EC4899", quadriceps: "#06B6D4", hamstrings: "#F97316",
    glutes: "#E8614D", calves: "#14B8A6", core: "#6366F1", full_body: "#A855F7",
  };

  const renderExercise = ({ item }) => (
    <Card>
      <View className="flex-row items-center">
        <View
          className="rounded-xl p-2.5 mr-3"
          style={{ backgroundColor: (muscleColor[item.muscle_group] || "#6B7280") + "20" }}
        >
          <Ionicons name="barbell" size={22} color={muscleColor[item.muscle_group] || "#6B7280"} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold">{item.name}</Text>
          <View className="flex-row items-center mt-1 flex-wrap gap-1">
            {item.muscle_group && (
              <Badge text={item.muscle_group.replace("_", " ")} color="blue" />
            )}
            {item.category && (
              <Badge text={item.category} color="gray" />
            )}
            {item.equipment && (
              <Text className="text-gray-500 text-xs ml-1">{item.equipment}</Text>
            )}
          </View>
        </View>
        {item.is_custom === 1 && (
          <View className="bg-yellow-500/20 rounded-full px-2 py-0.5">
            <Text className="text-yellow-500 text-xs">Custom</Text>
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-5 pt-2">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Exercise Library</Text>
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="add-circle-outline" size={26} color="#E8614D" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="bg-dark-card rounded-xl flex-row items-center px-3 mb-3 border border-gray-700">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
            placeholderTextColor="#6B7280"
            className="flex-1 text-white py-3 ml-2"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Muscle group filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MUSCLE_GROUPS}
          keyExtractor={(item) => item}
          className="mb-2"
          style={{ maxHeight: 36 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedMuscle(item)}
              className={`px-3 py-1.5 rounded-full mr-2 ${
                selectedMuscle === item ? "bg-primary" : "bg-dark-card border border-gray-700"
              }`}
            >
              <Text className={`text-xs font-medium capitalize ${
                selectedMuscle === item ? "text-white" : "text-gray-400"
              }`}>
                {item === "All" ? "All Muscles" : item.replace("_", " ")}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Category filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          className="mb-3"
          style={{ maxHeight: 36 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              className={`px-3 py-1.5 rounded-full mr-2 ${
                selectedCategory === item ? "bg-blue-500" : "bg-dark-card border border-gray-700"
              }`}
            >
              <Text className={`text-xs font-medium capitalize ${
                selectedCategory === item ? "text-white" : "text-gray-400"
              }`}>
                {item === "All" ? "All Types" : item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Count */}
        <Text className="text-gray-400 text-xs mb-2">
          {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderExercise}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="barbell-outline"
              title="No exercises found"
              message={search ? "Try a different search term" : "No exercises match the selected filters"}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
