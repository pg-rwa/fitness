import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, Badge, Button, EmptyState } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function TemplatesScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await api("/workout-templates?limit=50");
      setTemplates(data.data || []);
    } catch {}
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-5 pt-2">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold flex-1">Templates</Text>
          <TouchableOpacity
            onPress={() => router.push("/(app)/trainer/template-builder")}
            className="bg-primary rounded-xl px-4 py-2"
          >
            <Text className="text-white font-semibold">+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/(app)/trainer/template-builder?id=${item.id}`)}>
            <View className="flex-row items-center">
              <View className="bg-green-500/20 rounded-xl p-2.5 mr-3">
                <Ionicons name="document-text" size={22} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">{item.name}</Text>
                {item.description && <Text className="text-gray-400 text-xs mt-0.5 numberOfLines={1}">{item.description}</Text>}
              </View>
              <View className="items-end">
                {item.difficulty && <Badge text={item.difficulty} color="blue" />}
                {item.is_public === 1 && <Text className="text-gray-500 text-xs mt-1">Public</Text>}
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState icon="document-text-outline" title="No templates" message="Create your first workout template" />
        }
      />
    </SafeAreaView>
  );
}
