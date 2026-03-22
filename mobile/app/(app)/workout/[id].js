import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Card, Badge, StatCard, LoadingScreen } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ExerciseThumbnail from "../../../components/ExerciseThumbnail";
import { formatDate, formatDuration } from "../../../lib/format";

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [session, setSession] = useState(null);

  useEffect(() => {
    api(`/workout-sessions/${id}`).then(setSession).catch(() => {});
  }, [id]);

  if (!session) return <LoadingScreen />;

  const isComplete = !!session.ended_at;

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mt-2 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">{session.name}</Text>
            <Text className="text-gray-400 text-sm">{formatDate(session.started_at)}</Text>
          </View>
          <Badge text={isComplete ? "Completed" : "In Progress"} color={isComplete ? "green" : "yellow"} />
        </View>

        {/* Stats */}
        {isComplete && (
          <View className="flex-row mb-4">
            <StatCard label="Duration" value={formatDuration(session.started_at, session.ended_at)} icon="time" />
            <StatCard label="Volume" value={Math.round(session.total_volume || 0).toLocaleString()} unit="kg" icon="barbell" />
          </View>
        )}

        {session.mood_before && (
          <View className="flex-row mb-4">
            <StatCard label="Mood Before" value={session.mood_before} unit="/10" icon="happy-outline" color="#F59E0B" />
            {session.mood_after && <StatCard label="Mood After" value={session.mood_after} unit="/10" icon="happy" color="#10B981" />}
          </View>
        )}

        {/* Personal Records */}
        {session.personal_records?.length > 0 && (
          <Card className="bg-yellow-500/10 border border-yellow-500/30 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="trophy" size={22} color="#F59E0B" />
              <Text className="text-yellow-400 font-bold ml-2">Personal Records!</Text>
            </View>
            {session.personal_records.map((pr) => (
              <Text key={pr.id} className="text-gray-300 text-sm ml-7">
                {pr.record_type === "max_weight" ? "Max Weight" : "Max Volume"}: {pr.value}
                {pr.previous_value > 0 && ` (was ${pr.previous_value})`}
              </Text>
            ))}
          </Card>
        )}

        {/* Exercises */}
        {session.exercises?.map((exercise) => {
          const completedSets = exercise.sets?.filter((s) => s.completed).length || 0;
          const totalSets = exercise.sets?.length || 0;
          return (
            <Card key={exercise.id} className="mb-3">
              <View className="flex-row items-center mb-2">
                <View className="mr-3">
                  <ExerciseThumbnail photoUrl={exercise.photo_url} muscleGroup={exercise.muscle_group} size={36} />
                </View>
                <Text className="text-white font-semibold flex-1">{exercise.exercise_name}</Text>
                <Text className="text-gray-400 text-xs">{completedSets}/{totalSets} sets</Text>
              </View>
              {exercise.sets?.map((set) => (
                <View key={set.id} className="flex-row items-center py-1.5 border-b border-gray-700/50">
                  <Text className="text-gray-400 text-sm w-12">Set {set.set_number}</Text>
                  <Text className="text-white text-sm flex-1">{set.reps || 0} reps</Text>
                  <Text className="text-white text-sm flex-1">{set.weight_kg || 0} kg</Text>
                  {set.rpe && <Text className="text-gray-400 text-sm">RPE {set.rpe}</Text>}
                  <Ionicons
                    name={set.completed ? "checkmark-circle" : "ellipse-outline"}
                    size={18}
                    color={set.completed ? "#10B981" : "#6B7280"}
                    style={{ marginLeft: 8 }}
                  />
                </View>
              ))}
            </Card>
          );
        })}

        <View className="pb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
