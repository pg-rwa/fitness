import { View, Text, Alert, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";
import { Button, Input, Card, Badge } from "../../../components/ui";
import { RestTimer } from "../../../components/RestTimer";
import ExerciseSearchModal from "../../../components/ExerciseSearchModal";
import ExerciseThumbnail from "../../../components/ExerciseThumbnail";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function StartWorkoutScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [moodBefore, setMoodBefore] = useState(5);
  const [showTimer, setShowTimer] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [replacingExId, setReplacingExId] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const startSession = async () => {
    setLoading(true);
    try {
      const body = { moodBefore };
      if (templateId) body.templateId = parseInt(templateId, 10);
      else body.name = "Quick Workout";

      const data = await api("/workout-sessions", { method: "POST", body });
      setSession(data);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startSession();
  }, []);

  // Timer
  useEffect(() => {
    if (!session) return;
    const startTime = new Date(session.started_at || session.created_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.id]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const refreshSession = useCallback(async () => {
    if (!session?.id) return;
    try {
      const updated = await api(`/workout-sessions/${session.id}`);
      setSession(updated);
    } catch {}
  }, [session?.id]);

  const logSet = async (seId, setData) => {
    try {
      await api(`/workout-sessions/${session.id}/exercises/${seId}/sets`, {
        method: "POST",
        body: { ...setData, completed: true },
      });
      await refreshSession();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const updateSet = async (seId, setId, setData) => {
    try {
      await api(`/workout-sessions/${session.id}/exercises/${seId}/sets/${setId}`, {
        method: "PUT",
        body: setData,
      });
      await refreshSession();
    } catch {}
  };

  const addExercise = async (exerciseId) => {
    try {
      await api(`/workout-sessions/${session.id}/exercises`, {
        method: "POST",
        body: { exerciseId },
      });
      await refreshSession();
      setShowAddExercise(false);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const replaceExercise = async (newExerciseId) => {
    try {
      await api(`/workout-sessions/${session.id}/exercises/${replacingExId}/replace`, {
        method: "PUT",
        body: { newExerciseId, updateTemplate: true },
      });
      await refreshSession();
      setReplacingExId(null);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const completeWorkout = async () => {
    Alert.alert("Complete Workout", "Finish this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: async () => {
          try {
            const data = await api(`/workout-sessions/${session.id}/complete`, {
              method: "PUT",
              body: { moodAfter: 8 },
            });
            router.replace(`/(app)/workout/${data.id}`);
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-dark items-center justify-center">
        <Text className="text-white text-lg">Starting workout...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mt-2 mb-4">
          <View>
            <Text className="text-white text-xl font-bold">{session.name}</Text>
            <Text className="text-primary text-sm font-mono">{formatTime(elapsed)}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setShowTimer(!showTimer)}
              className={`rounded-xl p-2.5 ${showTimer ? "bg-accent/20" : "bg-dark-card border border-gray-600"}`}
              activeOpacity={0.7}
            >
              <Ionicons name="timer-outline" size={22} color={showTimer ? "#F59E0B" : "#6B7280"} />
            </TouchableOpacity>
            <Button title="Finish" variant="secondary" onPress={completeWorkout} />
          </View>
        </View>

        {/* Rest Timer */}
        {showTimer && <RestTimer onDismiss={() => setShowTimer(false)} />}

        {/* Exercises */}
        {session.exercises?.map((exercise) => (
          <Card key={exercise.id} className="mb-4">
            <View className="flex-row items-center mb-3">
              {/* Muscle group color indicator */}
              <View className="mr-3">
                <ExerciseThumbnail muscleGroup={exercise.muscle_group} size={40} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">{exercise.exercise_name}</Text>
                <Text className="text-gray-400 text-xs capitalize">{exercise.muscle_group}</Text>
              </View>
              {/* Replace button */}
              <TouchableOpacity
                onPress={() => setReplacingExId(exercise.id)}
                className="border border-gray-600 rounded-lg px-2.5 py-1.5"
                activeOpacity={0.7}
              >
                <Text className="text-gray-400 text-xs">Replace</Text>
              </TouchableOpacity>
            </View>

            {/* Sets table header */}
            <View className="flex-row px-2 mb-2">
              <Text className="text-gray-500 text-xs w-10">Set</Text>
              <Text className="text-gray-500 text-xs flex-1 text-center">Reps</Text>
              <Text className="text-gray-500 text-xs flex-1 text-center">Weight</Text>
              <Text className="text-gray-500 text-xs flex-1 text-center">RPE</Text>
              <Text className="text-gray-500 text-xs w-10" />
            </View>

            {/* Sets */}
            {exercise.sets?.map((set) => (
              <View
                key={set.id}
                className={`flex-row items-center px-2 py-2 rounded-lg mb-1 ${
                  set.completed ? "bg-green-500/10" : "bg-dark"
                }`}
              >
                <Text className="text-gray-400 text-sm w-10">{set.set_number}</Text>
                <Text className="text-white text-sm flex-1 text-center">{set.reps || "-"}</Text>
                <Text className="text-white text-sm flex-1 text-center">{set.weight_kg || "-"}</Text>
                <Text className="text-white text-sm flex-1 text-center">{set.rpe || "-"}</Text>
                <TouchableOpacity
                  className="w-10 items-center"
                  onPress={() => {
                    if (!set.completed) {
                      updateSet(exercise.id, set.id, {
                        completed: true,
                        reps: set.reps || 10,
                        weightKg: set.weight_kg || 0,
                      });
                    }
                  }}
                >
                  <Ionicons
                    name={set.completed ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={set.completed ? "#10B981" : "#6B7280"}
                  />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add set button */}
            <TouchableOpacity
              onPress={() => logSet(exercise.id, { reps: 10, weightKg: 0 })}
              className="flex-row items-center justify-center mt-2 py-2"
            >
              <Ionicons name="add-circle-outline" size={18} color="#E8614D" />
              <Text className="text-primary text-sm ml-1">Add Set</Text>
            </TouchableOpacity>
          </Card>
        ))}

        {/* Add Exercise button */}
        <TouchableOpacity
          onPress={() => setShowAddExercise(true)}
          className="bg-dark-card border border-dashed border-gray-600 rounded-2xl p-4 mb-4 flex-row items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={24} color="#E8614D" />
          <Text className="text-primary font-semibold text-base ml-2">Add Exercise</Text>
        </TouchableOpacity>

        <View className="pb-8" />
      </ScrollView>

      {/* Exercise Search Modal — for adding */}
      <ExerciseSearchModal
        visible={showAddExercise}
        onSelect={addExercise}
        onClose={() => setShowAddExercise(false)}
      />

      {/* Exercise Search Modal — for replacing */}
      <ExerciseSearchModal
        visible={!!replacingExId}
        onSelect={replaceExercise}
        onClose={() => setReplacingExId(null)}
      />
    </SafeAreaView>
  );
}
