import { View, Text, TouchableOpacity, FlatList, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import { PullToRefresh, EmptyState, Badge } from "../../components/ui";

function ChallengeCard({ challenge, onJoin, onLeave, onPress }) {
  const progress = challenge.my_participation_id
    ? Math.min(100, Math.round(((challenge.current_value || 0) / challenge.target_value) * 100))
    : null;

  return (
    <TouchableOpacity onPress={onPress} className="bg-dark-card rounded-2xl p-4 mb-3 mx-5" activeOpacity={0.7}>
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-white font-bold text-base">{challenge.title}</Text>
          <Text className="text-gray-500 text-xs mt-0.5">by {challenge.creator_name}</Text>
        </View>
        <Badge
          label={challenge.status}
          variant={challenge.status === "active" ? "success" : "default"}
        />
      </View>
      {challenge.description ? (
        <Text className="text-gray-400 text-sm mb-3" numberOfLines={2}>{challenge.description}</Text>
      ) : null}
      <View className="flex-row items-center mb-3">
        <Ionicons name="people" size={14} color="#6B7280" />
        <Text className="text-gray-500 text-xs ml-1 mr-4">{challenge.participant_count}</Text>
        <Ionicons name="flag" size={14} color="#6B7280" />
        <Text className="text-gray-500 text-xs ml-1">{challenge.target_value} {challenge.unit}</Text>
      </View>
      {progress !== null ? (
        <View className="mb-3">
          <View className="bg-gray-700 rounded-full h-2 overflow-hidden">
            <View className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
          </View>
          <Text className="text-gray-500 text-[10px] mt-1">{progress}% complete</Text>
        </View>
      ) : null}
      <View className="flex-row gap-2">
        {challenge.my_participation_id ? (
          <TouchableOpacity onPress={onLeave} className="bg-red-600/20 rounded-xl py-2 px-4">
            <Text className="text-red-400 text-xs font-semibold">Leave</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onJoin} className="bg-primary rounded-xl py-2 px-4">
            <Text className="text-white text-xs font-semibold">Join</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SocialScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("challenges");
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbPeriod, setLbPeriod] = useState("week");
  const [lbMetric, setLbMetric] = useState("workouts");

  const loadChallenges = useCallback(async () => {
    try {
      const data = await api("/social/challenges?status=active");
      setChallenges(data.data || []);
    } catch {}
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await api(`/social/leaderboard?period=${lbPeriod}&metric=${lbMetric}`);
      setLeaderboard(data.leaderboard || []);
    } catch {}
  }, [lbPeriod, lbMetric]);

  useEffect(() => { loadChallenges(); }, [loadChallenges]);
  useEffect(() => { if (tab === "leaderboard") loadLeaderboard(); }, [tab, loadLeaderboard]);

  const joinChallenge = async (id) => {
    try {
      await api(`/social/challenges/${id}/join`, { method: "POST" });
      loadChallenges();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const leaveChallenge = async (id) => {
    try {
      await api(`/social/challenges/${id}/leave`, { method: "DELETE" });
      loadChallenges();
    } catch {}
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return "trophy";
    if (rank === 2) return "medal";
    if (rank === 3) return "ribbon";
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return "#FBBF24";
    if (rank === 2) return "#9CA3AF";
    if (rank === 3) return "#F97316";
    return "#6B7280";
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 mt-2 mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Social</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View className="flex-row mx-5 bg-dark-card rounded-xl p-1 mb-4">
        {["challenges", "leaderboard"].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg ${tab === t ? "bg-primary" : ""}`}
          >
            <Text className={`text-center text-sm font-semibold ${tab === t ? "text-white" : "text-gray-400"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "challenges" ? (
        <PullToRefresh onRefresh={loadChallenges}>
          {challenges.length === 0 ? (
            <EmptyState icon="people" title="No challenges yet" subtitle="Check back soon!" />
          ) : (
            challenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                onJoin={() => joinChallenge(c.id)}
                onLeave={() => leaveChallenge(c.id)}
                onPress={() => {}}
              />
            ))
          )}
        </PullToRefresh>
      ) : (
        <PullToRefresh onRefresh={loadLeaderboard}>
          {/* Period/Metric selectors */}
          <View className="flex-row px-5 mb-4 gap-2">
            {["week", "month", "year"].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setLbPeriod(p)}
                className={`px-3 py-1.5 rounded-full ${lbPeriod === p ? "bg-primary/20" : "bg-dark-card"}`}
              >
                <Text className={`text-xs font-semibold ${lbPeriod === p ? "text-primary" : "text-gray-400"}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {leaderboard.length === 0 ? (
            <EmptyState icon="trophy" title="No activity" subtitle="Start working out to appear here!" />
          ) : (
            <View className="mx-5">
              {leaderboard.map((entry) => (
                <View key={entry.user_id} className="flex-row items-center bg-dark-card rounded-xl px-4 py-3 mb-2">
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: getRankColor(entry.rank) + "30" }}>
                    {getRankIcon(entry.rank) ? (
                      <Ionicons name={getRankIcon(entry.rank)} size={16} color={getRankColor(entry.rank)} />
                    ) : (
                      <Text className="text-gray-500 text-xs font-bold">{entry.rank}</Text>
                    )}
                  </View>
                  <Text className="flex-1 text-white text-sm font-medium">{entry.name}</Text>
                  <Text className="text-primary font-bold text-sm">
                    {lbMetric === "volume" ? `${Math.round(entry.score).toLocaleString()} kg` : entry.score}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </PullToRefresh>
      )}
    </SafeAreaView>
  );
}
