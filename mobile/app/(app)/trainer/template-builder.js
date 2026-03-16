import { View, Text, ScrollView, TouchableOpacity, Alert, FlatList, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Button, Input, Card, Badge, LoadingScreen, EmptyState } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function TemplateBuilderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ name: "", description: "", difficulty: "intermediate", isPublic: false });
  const [saving, setSaving] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [editingExercise, setEditingExercise] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingExercise, setSavingExercise] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const loadTemplate = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api(`/workout-templates/${id}`);
      setTemplate(data);
      setForm({
        name: data.name,
        description: data.description || "",
        difficulty: data.difficulty,
        isPublic: !!data.is_public,
      });
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

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
      const list = Array.isArray(data) ? data : data.data || [];
      setAvailableExercises(list);
    } catch {}
  };

  const addExercise = async (exerciseId) => {
    try {
      const sortOrder = (template?.exercises?.length || 0) + 1;
      await api(`/workout-templates/${id}/exercises`, {
        method: "POST",
        body: { exerciseId, targetSets: 3, targetReps: 10, sortOrder },
      });
      await loadTemplate();
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
            await loadTemplate();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const openEditExercise = (ex) => {
    setEditingExercise(ex);
    setEditForm({
      targetSets: String(ex.target_sets || 3),
      targetReps: String(ex.target_reps || 10),
      targetWeightKg: ex.target_weight_kg ? String(ex.target_weight_kg) : "",
      restSeconds: ex.rest_seconds ? String(ex.rest_seconds) : "",
      supersetGroup: ex.superset_group || "",
      notes: ex.notes || "",
    });
  };

  const saveExerciseEdit = async () => {
    if (!editingExercise) return;
    setSavingExercise(true);
    try {
      await api(`/workout-templates/${id}/exercises/${editingExercise.id}`, {
        method: "PUT",
        body: {
          targetSets: parseInt(editForm.targetSets) || 3,
          targetReps: parseInt(editForm.targetReps) || 10,
          targetWeightKg: editForm.targetWeightKg ? parseFloat(editForm.targetWeightKg) : null,
          restSeconds: editForm.restSeconds ? parseInt(editForm.restSeconds) : null,
          supersetGroup: editForm.supersetGroup || null,
          notes: editForm.notes || null,
        },
      });
      setEditingExercise(null);
      await loadTemplate();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSavingExercise(false);
    }
  };

  const moveExercise = async (ex, direction) => {
    const exercises = template?.exercises || [];
    const idx = exercises.findIndex((e) => e.id === ex.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= exercises.length) return;

    try {
      const other = exercises[swapIdx];
      await Promise.all([
        api(`/workout-templates/${id}/exercises/${ex.id}`, {
          method: "PUT",
          body: { sortOrder: swapIdx + 1 },
        }),
        api(`/workout-templates/${id}/exercises/${other.id}`, {
          method: "PUT",
          body: { sortOrder: idx + 1 },
        }),
      ]);
      await loadTemplate();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const duplicateTemplate = async () => {
    setDuplicating(true);
    try {
      const data = await api(`/workout-templates/${id}/duplicate`, { method: "POST" });
      Alert.alert("Duplicated", "Template copied successfully", [
        { text: "Open Copy", onPress: () => router.replace(`/(app)/trainer/template-builder?id=${data.id}`) },
        { text: "Stay Here", style: "cancel" },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setDuplicating(false);
    }
  };

  const deleteTemplate = () => {
    Alert.alert("Delete Template", "This cannot be undone. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/workout-templates/${id}`, { method: "DELETE" });
            router.back();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const update = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));
  const updateEdit = (key) => (val) => setEditForm((prev) => ({ ...prev, [key]: val }));

  if (loading) return <LoadingScreen />;

  // Add Exercise search screen
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
        {exerciseSearch.length > 0 && exerciseSearch.length < 2 && (
          <Text className="text-gray-500 text-center text-sm">Type at least 2 characters</Text>
        )}
        <FlatList
          data={availableExercises}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Card onPress={() => addExercise(item.id)}>
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-white font-semibold">{item.name}</Text>
                  <Text className="text-gray-400 text-xs capitalize">
                    {item.muscle_group} | {item.category}
                  </Text>
                </View>
                <Ionicons name="add-circle" size={24} color="#E8614D" />
              </View>
            </Card>
          )}
          ListEmptyComponent={
            exerciseSearch.length >= 2 ? (
              <EmptyState icon="search-outline" title="No exercises found" message="Try a different search term" />
            ) : null
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mt-2 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-1">{id ? "Edit Template" : "New Template"}</Text>
          {id && (
            <View className="flex-row">
              <TouchableOpacity onPress={duplicateTemplate} disabled={duplicating} className="bg-blue-500/20 rounded-xl p-2 mr-2">
                <Ionicons name="copy-outline" size={20} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={deleteTemplate} className="bg-red-500/20 rounded-xl p-2">
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Form */}
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

        {/* Public toggle */}
        <TouchableOpacity
          onPress={() => update("isPublic")(!form.isPublic)}
          className="flex-row items-center bg-dark-card rounded-xl p-4 mb-4"
        >
          <Ionicons name={form.isPublic ? "globe" : "lock-closed"} size={20} color={form.isPublic ? "#10B981" : "#6B7280"} />
          <Text className="text-white ml-3 flex-1">Public Template</Text>
          <View className={`w-12 h-7 rounded-full justify-center ${form.isPublic ? "bg-green-500 items-end" : "bg-gray-600 items-start"}`}>
            <View className="w-5 h-5 bg-white rounded-full mx-1" />
          </View>
        </TouchableOpacity>

        <Button title={id ? "Save Changes" : "Create Template"} onPress={save} loading={saving} />

        {/* Exercises list */}
        {id && (
          <>
            <View className="flex-row items-center justify-between mt-6 mb-3">
              <Text className="text-white text-lg font-bold">
                Exercises{template?.exercises?.length ? ` (${template.exercises.length})` : ""}
              </Text>
              <TouchableOpacity onPress={() => setShowAddExercise(true)} className="bg-primary/20 rounded-lg px-3 py-1.5">
                <Text className="text-primary text-sm font-semibold">+ Add</Text>
              </TouchableOpacity>
            </View>

            {template?.exercises?.map((ex, idx) => (
              <Card key={ex.id}>
                <View className="flex-row items-center">
                  {/* Reorder buttons */}
                  <View className="mr-2">
                    <TouchableOpacity
                      onPress={() => moveExercise(ex, "up")}
                      disabled={idx === 0}
                      className="p-1"
                    >
                      <Ionicons name="chevron-up" size={16} color={idx === 0 ? "#4B5563" : "#9CA3AF"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveExercise(ex, "down")}
                      disabled={idx === template.exercises.length - 1}
                      className="p-1"
                    >
                      <Ionicons name="chevron-down" size={16} color={idx === template.exercises.length - 1 ? "#4B5563" : "#9CA3AF"} />
                    </TouchableOpacity>
                  </View>

                  <Text className="text-gray-500 text-sm w-7">{idx + 1}.</Text>
                  <TouchableOpacity className="flex-1" onPress={() => openEditExercise(ex)}>
                    <Text className="text-white font-semibold">{ex.exercise_name}</Text>
                    <Text className="text-gray-400 text-xs">
                      {ex.target_sets} sets x {ex.target_reps} reps
                      {ex.target_weight_kg ? ` @ ${ex.target_weight_kg}kg` : ""}
                      {ex.rest_seconds ? ` | ${ex.rest_seconds}s rest` : ""}
                    </Text>
                    {ex.superset_group && <Badge text={`Superset ${ex.superset_group}`} color="yellow" className="mt-1" />}
                    {ex.notes && <Text className="text-gray-500 text-xs mt-1">{ex.notes}</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => openEditExercise(ex)} className="p-2">
                    <Ionicons name="create-outline" size={18} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeExercise(ex.id)} className="p-2">
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}

            {(!template?.exercises || template.exercises.length === 0) && (
              <EmptyState icon="barbell-outline" title="No exercises" message="Tap + Add to build your template" />
            )}
          </>
        )}

        <View className="pb-8" />
      </ScrollView>

      {/* Edit Exercise Modal */}
      <Modal visible={!!editingExercise} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-dark-card rounded-t-3xl p-5 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-bold">Edit Exercise</Text>
              <TouchableOpacity onPress={() => setEditingExercise(null)}>
                <Ionicons name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {editingExercise && (
              <Text className="text-primary font-semibold mb-4">{editingExercise.exercise_name}</Text>
            )}

            <View className="flex-row">
              <View className="flex-1 mr-2">
                <Input label="Sets" value={editForm.targetSets} onChangeText={updateEdit("targetSets")} keyboardType="numeric" placeholder="3" />
              </View>
              <View className="flex-1 ml-2">
                <Input label="Reps" value={editForm.targetReps} onChangeText={updateEdit("targetReps")} keyboardType="numeric" placeholder="10" />
              </View>
            </View>

            <View className="flex-row">
              <View className="flex-1 mr-2">
                <Input label="Weight (kg)" value={editForm.targetWeightKg} onChangeText={updateEdit("targetWeightKg")} keyboardType="decimal-pad" placeholder="Optional" />
              </View>
              <View className="flex-1 ml-2">
                <Input label="Rest (sec)" value={editForm.restSeconds} onChangeText={updateEdit("restSeconds")} keyboardType="numeric" placeholder="60" />
              </View>
            </View>

            <Input label="Superset Group" value={editForm.supersetGroup} onChangeText={updateEdit("supersetGroup")} placeholder="e.g. A, B, C" />
            <Input label="Notes" value={editForm.notes} onChangeText={updateEdit("notes")} placeholder="Optional notes" />

            <Button title="Save" onPress={saveExerciseEdit} loading={savingExercise} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
