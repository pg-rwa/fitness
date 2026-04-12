import { View, Text, Alert, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";
import { Button, Input, Card, Badge, StatCard } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import VoiceCommand from "../../../components/VoiceCommand";

export default function StartWorkoutScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [moodBefore, setMoodBefore] = useState(5);

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

  useEffect(() => { startSession(); }, []);

  const logSet = async (seId, setData) => {
    try {
      await api(`/workout-sessions/${session.id}/exercises/${seId}/sets`, {
        method: "POST",
        body: { ...setData, completed: true },
      });
      // Reload session
      const updated = await api(`/workout-sessions/${session.id}`);
      setSession(updated);
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
      const updated = await api(`/workout-sessions/${session.id}`);
      setSession(updated);
    } catch {}
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
      <VoiceCommand visible={true} sessionId={session.id} />
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mt-2 mb-4">
          <View>
            <Text className="text-white text-xl font-bold">{session.name}</Text>
            <Text className="text-gray-400 text-sm">In progress — talk to Peqo</Text>
          </View>
          <Button title="Finish" variant="secondary" onPress={completeWorkout} />
        </View>

        {/* Exercises */}
        {session.exercises?.map((exercise) => (
          <Card key={exercise.id} className="mb-4">
            <View className="flex-row items-center mb-3">
              <View className="bg-primary/20 rounded-lg p-2 mr-3">
                <Ionicons name="barbell" size={18} color="#E8614D" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">{exercise.exercise_name}</Text>
                <Text className="text-gray-400 text-xs capitalize">{exercise.muscle_group}</Text>
              </View>
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
              <View key={set.id} className={`flex-row items-center px-2 py-2 rounded-lg mb-1 ${set.completed ? "bg-green-500/10" : "bg-dark"}`}>
                <Text className="text-gray-400 text-sm w-10">{set.set_number}</Text>
                <Text className="text-white text-sm flex-1 text-center">{set.reps || "-"}</Text>
                <Text className="text-white text-sm flex-1 text-center">{set.weight_kg || "-"}</Text>
                <Text className="text-white text-sm flex-1 text-center">{set.rpe || "-"}</Text>
                <TouchableOpacity
                  className="w-10 items-center"
                  onPress={() => {
                    if (!set.completed) {
                      updateSet(exercise.id, set.id, { completed: true, reps: set.reps || 10, weightKg: set.weight_kg || 0 });
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

        <View className="pb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
