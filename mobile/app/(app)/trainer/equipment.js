import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, Badge, Input, Button, EmptyState } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function EquipmentScreen() {
  const router = useRouter();
  const [equipment, setEquipment] = useState([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", brand: "", category: "machine", gymLocation: "" });
  const [saving, setSaving] = useState(false);

  const loadEquipment = useCallback(async () => {
    try {
      const data = await api(`/equipment?search=${encodeURIComponent(search)}`);
      setEquipment(data.data || []);
    } catch {}
  }, [search]);

  useEffect(() => { loadEquipment(); }, [loadEquipment]);

  const update = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  const addEquipment = async () => {
    if (!form.name.trim()) return Alert.alert("Error", "Name is required");
    setSaving(true);
    try {
      await api("/equipment", { method: "POST", body: form });
      setShowAdd(false);
      setForm({ name: "", brand: "", category: "machine", gymLocation: "" });
      await loadEquipment();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const categoryIcons = { machine: "cog", free_weight: "barbell", cable: "git-pull-request", bodyweight: "body", cardio: "heart", other: "help-circle" };

  if (showAdd) {
    return (
      <SafeAreaView className="flex-1 bg-dark px-5">
        <View className="flex-row items-center justify-between mt-2 mb-4">
          <TouchableOpacity onPress={() => setShowAdd(false)}>
            <Text className="text-primary text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Add Equipment</Text>
          <View style={{ width: 50 }} />
        </View>
        <Input label="Name" value={form.name} onChangeText={update("name")} placeholder="e.g. Lat Pulldown" />
        <Input label="Brand" value={form.brand} onChangeText={update("brand")} placeholder="e.g. LifeFitness" />
        <Input label="Location" value={form.gymLocation} onChangeText={update("gymLocation")} placeholder="e.g. Zone A" />

        <Text className="text-gray-400 text-sm mb-2 ml-1">Category</Text>
        <View className="flex-row flex-wrap mb-4">
          {["machine", "free_weight", "cable", "bodyweight", "cardio", "other"].map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => update("category")(c)}
              className={`px-3 py-2 rounded-lg mr-2 mb-2 ${form.category === c ? "bg-primary" : "bg-dark-card"}`}
            >
              <Text className={`text-xs capitalize ${form.category === c ? "text-white" : "text-gray-400"}`}>{c.replace("_", " ")}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Add Equipment" onPress={addEquipment} loading={saving} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-5 pt-2">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold flex-1">Equipment</Text>
          <TouchableOpacity onPress={() => setShowAdd(true)} className="bg-primary rounded-xl px-4 py-2">
            <Text className="text-white font-semibold">+ Add</Text>
          </TouchableOpacity>
        </View>
        <Input placeholder="Search equipment..." value={search} onChangeText={setSearch} icon="search-outline" />
      </View>

      <FlatList
        data={equipment}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Card>
            <View className="flex-row items-center">
              <View className="bg-purple-500/20 rounded-xl p-2.5 mr-3">
                <Ionicons name={categoryIcons[item.category] || "help-circle"} size={22} color="#A855F7" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">{item.name}</Text>
                <Text className="text-gray-400 text-xs">
                  {item.brand && `${item.brand} | `}{item.gym_location || "No location"}
                </Text>
              </View>
              <Badge text={item.category.replace("_", " ")} color="gray" />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState icon="hardware-chip-outline" title="No equipment" message="Add gym equipment to your library" />
        }
      />
    </SafeAreaView>
  );
}
