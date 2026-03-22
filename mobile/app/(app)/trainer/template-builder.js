import { View, Text, ScrollView, TouchableOpacity, Alert, FlatList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Button, Input, Card, Badge } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ExerciseThumbnail from "../../../components/ExerciseThumbnail";

export default function TemplateBuilderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [template, setTemplate] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", difficulty: "intermediate", isPublic: false });
  const [exercises, setExercises] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [exerciseSearch, setExerciseSearch] = useState("");

  useEffect(() => {
    if (id) {
      api(`/workout-templates/${id}`).then((data) => {
        setTemplate(data);
        setForm({ name: data.name, description: data.description || "", difficulty: data.difficulty, isPublic: !!data.is_public });
      }).catch(() => {});
    }
  }, [id]);

  const save = async () => {
    if (!form.name.trim()) return Alert.alert("Error", "Name is required");
    setSaving(true);
    try {
      if (id) {
        const data = await api(`/workout-templates/${id}`, { method: "PUT", body: form });
        setTemplate(data);
        Alert.alert("Saved", "Template updated");
      } else {
        const data = await api("/workout-templates", { method: "POST", body: form });
        router.replace(`/(app)/trainer/template-builder?id=${data.id}`);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const searchExercises = async (q) => {
    setExerciseSearch(q);
    if (q.length < 2) return setAvailableExercises([]);
    try {
      const data = await api(`/exercises?search=${encodeURIComponent(q)}`);
      setAvailableExercises(data);
    } catch {}
  };

  const addExercise = async (exerciseId) => {
    try {
      await api(`/workout-templates/${id}/exercises`, {
        method: "POST",
        body: { exerciseId, targetSets: 3, targetReps: 10 },
      });
      const updated = await api(`/workout-templates/${id}`);
      setTemplate(updated);
      setShowAddExercise(false);
      setExerciseSearch("");
      setAvailableExercises([]);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const removeExercise = async (teId) => {
    Alert.alert("Remove Exercise", "Remove from template?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/workout-templates/${id}/exercises/${teId}`, { method: "DELETE" });
            const updated = await api(`/workout-templates/${id}`);
            setTemplate(updated);
          } catch {}
        },
      },
    ]);
  };

  const update = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  if (showAddExercise) {
    return (
      <SafeAreaView className="flex-1 bg-dark px-5">
        <View className="flex-row items-center justify-between mt-2 mb-4">
          <TouchableOpacity onPress={() => setShowAddExercise(false)}>
            <Text className="text-primary text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Add Exercise</Text>
          <View style={{ width: 50 }} />
        </View>
        <Input placeholder="Search exercises..." value={exerciseSearch} onChangeText={searchExercises} icon="search-outline" />
        <FlatList
          data={availableExercises}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Card onPress={() => addExercise(item.id)}>
              <View className="flex-row items-center">
                <View className="mr-3">
                  <ExerciseThumbnail muscleGroup={item.muscle_group} size={40} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">{item.name}</Text>
                  <Text className="text-gray-400 text-xs capitalize">{item.muscle_group} | {item.category}</Text>
                </View>
                <Ionicons name="add-circle" size={24} color="#E8614D" />
              </View>
            </Card>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mt-2 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">{id ? "Edit Template" : "New Template"}</Text>
        </View>

        <Input label="Template Name" value={form.name} onChangeText={update("name")} placeholder="e.g. Push Day" />
        <Input label="Description" value={form.description} onChangeText={update("description")} placeholder="Optional description" />

        <Text className="text-gray-400 text-sm mb-2 ml-1">Difficulty</Text>
        <View className="flex-row mb-4">
          {["beginner", "intermediate", "advanced"].map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => update("difficulty")(d)}
              className={`flex-1 py-2.5 rounded-lg mx-0.5 items-center ${form.difficulty === d ? "bg-primary" : "bg-dark-card"}`}
            >
              <Text className={`text-xs font-semibold capitalize ${form.difficulty === d ? "text-white" : "text-gray-400"}`}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title={id ? "Save Changes" : "Create Template"} onPress={save} loading={saving} />

        {/* Exercises list */}
        {id && template?.exercises && (
          <>
            <View className="flex-row items-center justify-between mt-6 mb-3">
              <Text className="text-white text-lg font-bold">Exercises</Text>
              <TouchableOpacity onPress={() => setShowAddExercise(true)} className="bg-primary/20 rounded-lg px-3 py-1.5">
                <Text className="text-primary text-sm font-semibold">+ Add</Text>
              </TouchableOpacity>
            </View>

            {template.exercises.map((ex, idx) => (
              <Card key={ex.id}>
                <View className="flex-row items-center">
                  <View className="mr-3">
                    <ExerciseThumbnail muscleGroup={ex.muscle_group} size={40} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{ex.exercise_name}</Text>
                    <Text className="text-gray-400 text-xs">
                      {ex.target_sets} sets x {ex.target_reps} reps
                      {ex.target_weight_kg ? ` @ ${ex.target_weight_kg}kg` : ""}
                      {ex.rest_seconds ? ` | ${ex.rest_seconds}s rest` : ""}
                    </Text>
                    {ex.superset_group && <Badge text={`Superset ${ex.superset_group}`} color="yellow" className="mt-1" />}
                  </View>
                  <TouchableOpacity onPress={() => removeExercise(ex.id)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}

            {template.exercises.length === 0 && (
              <Text className="text-gray-500 text-center mt-4">No exercises added yet</Text>
            )}
          </>
        )}

        <View className="pb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
