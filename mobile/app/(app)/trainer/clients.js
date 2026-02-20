import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, Badge, Input, EmptyState } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ClientsScreen() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");

  const loadClients = useCallback(async () => {
    try {
      const data = await api("/users?role=client&limit=100");
      setClients(data.data || []);
    } catch {}
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const filtered = clients.filter(
    (c) =>
      !search ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-5 pt-2">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">My Clients</Text>
        </View>
        <Input placeholder="Search clients..." value={search} onChangeText={setSearch} icon="search-outline" />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/(app)/trainer/client-detail?id=${item.id}`)}>
            <View className="flex-row items-center">
              <View className="bg-blue-500/20 rounded-full p-3 mr-3">
                <Ionicons name="person" size={22} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">{item.first_name} {item.last_name}</Text>
                <Text className="text-gray-400 text-xs">{item.email}</Text>
              </View>
              <Badge text={item.status || "active"} color={item.status === "active" ? "green" : "gray"} />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState icon="people-outline" title="No clients yet" message="Invite clients to get started" />
        }
      />
    </SafeAreaView>
  );
}
