import { View, Text, FlatList, TouchableOpacity, Alert, Modal, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, Badge, Input, Button, EmptyState, LoadingScreen } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = ["machine", "free_weight", "cable", "bodyweight", "cardio", "other"];
const CATEGORY_ICONS = {
  machine: "cog",
  free_weight: "barbell",
  cable: "git-pull-request",
  bodyweight: "body",
  cardio: "heart",
  other: "help-circle",
};
const CATEGORY_COLORS = {
  machine: "#A855F7",
  free_weight: "#3B82F6",
  cable: "#F59E0B",
  bodyweight: "#10B981",
  cardio: "#EF4444",
  other: "#6B7280",
};

export default function EquipmentScreen() {
  const router = useRouter();
  const [equipment, setEquipment] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState(null);

  // Add/Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", brand: "", category: "machine", gymLocation: "", notes: "" });
  const [saving, setSaving] = useState(false);

  // Detail expansion
  const [expandedId, setExpandedId] = useState(null);

  const loadEquipment = useCallback(async () => {
    try {
      let url = `/equipment?search=${encodeURIComponent(search)}`;
      if (filterCategory) url += `&category=${filterCategory}`;
      const data = await api(url);
      setEquipment(data.data || data || []);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEquipment();
    setRefreshing(false);
  };

  const update = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  const openAddForm = () => {
    setEditingId(null);
    setForm({ name: "", brand: "", category: "machine", gymLocation: "", notes: "" });
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      brand: item.brand || "",
      category: item.category || "machine",
      gymLocation: item.gym_location || "",
      notes: item.notes || "",
    });
    setShowForm(true);
  };

  const saveEquipment = async () => {
    if (!form.name.trim()) return Alert.alert("Error", "Name is required");
    setSaving(true);
    try {
      if (editingId) {
        await api(`/equipment/${editingId}`, { method: "PUT", body: form });
      } else {
        await api("/equipment", { method: "POST", body: form });
      }
      setShowForm(false);
      setEditingId(null);
      await loadEquipment();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteEquipment = (item) => {
    Alert.alert("Delete Equipment", `Delete "${item.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/equipment/${item.id}`, { method: "DELETE" });
            setExpandedId(null);
            await loadEquipment();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) return <LoadingScreen />;

  const renderItem = ({ item }) => {
    const color = CATEGORY_COLORS[item.category] || "#6B7280";
    const icon = CATEGORY_ICONS[item.category] || "help-circle";
    const isExpanded = expandedId === item.id;

    return (
      <Card onPress={() => toggleExpand(item.id)}>
        <View className="flex-row items-center">
          <View className="rounded-xl p-2.5 mr-3" style={{ backgroundColor: `${color}20` }}>
            <Ionicons name={icon} size={22} color={color} />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold">{item.name}</Text>
            <Text className="text-gray-400 text-xs">
              {item.brand ? `${item.brand} | ` : ""}{item.gym_location || "No location"}
            </Text>
          </View>
          <Badge text={item.category.replace("_", " ")} color="gray" />
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" style={{ marginLeft: 8 }} />
        </View>

        {isExpanded && (
          <View className="mt-3 pt-3 border-t border-gray-700">
            {item.brand && (
              <View className="flex-row mb-1">
                <Text className="text-gray-500 text-xs w-20">Brand</Text>
                <Text className="text-gray-300 text-xs">{item.brand}</Text>
              </View>
            )}
            {item.model && (
              <View className="flex-row mb-1">
                <Text className="text-gray-500 text-xs w-20">Model</Text>
                <Text className="text-gray-300 text-xs">{item.model}</Text>
              </View>
            )}
            {item.gym_location && (
              <View className="flex-row mb-1">
                <Text className="text-gray-500 text-xs w-20">Location</Text>
                <Text className="text-gray-300 text-xs">{item.gym_location}</Text>
              </View>
            )}
            {item.notes && (
              <View className="flex-row mb-1">
                <Text className="text-gray-500 text-xs w-20">Notes</Text>
                <Text className="text-gray-300 text-xs flex-1">{item.notes}</Text>
              </View>
            )}
            {item.default_settings && (
              <View className="flex-row mb-1">
                <Text className="text-gray-500 text-xs w-20">Settings</Text>
                <Text className="text-gray-300 text-xs flex-1">
                  {typeof item.default_settings === "string" ? item.default_settings : JSON.stringify(item.default_settings)}
                </Text>
              </View>
            )}

            <View className="flex-row mt-3">
              <TouchableOpacity
                onPress={() => openEditForm(item)}
                className="flex-1 bg-blue-500/20 rounded-xl py-2.5 items-center mr-2 flex-row justify-center"
              >
                <Ionicons name="create-outline" size={16} color="#3B82F6" />
                <Text className="text-blue-400 font-semibold text-sm ml-1.5">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteEquipment(item)}
                className="flex-1 bg-red-500/20 rounded-xl py-2.5 items-center flex-row justify-center"
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text className="text-red-400 font-semibold text-sm ml-1.5">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-5 pt-2">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold flex-1">Equipment</Text>
          <TouchableOpacity onPress={openAddForm} className="bg-primary rounded-xl px-4 py-2">
            <Text className="text-white font-semibold">+ Add</Text>
          </TouchableOpacity>
        </View>
        <Input placeholder="Search equipment..." value={search} onChangeText={setSearch} icon="search-outline" />

        {/* Category filter chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...CATEGORIES]}
          keyExtractor={(item) => item || "all"}
          className="mb-3"
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              onPress={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg mr-2 ${filterCategory === cat ? "bg-primary" : "bg-dark-card"}`}
            >
              <Text className={`text-xs capitalize ${filterCategory === cat ? "text-white" : "text-gray-400"}`}>
                {cat ? cat.replace("_", " ") : "All"}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={equipment}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8614D" />}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState icon="hardware-chip-outline" title="No equipment" message={search ? "No matches found" : "Add gym equipment to your library"} />
        }
        ListHeaderComponent={
          equipment.length > 0 ? (
            <Text className="text-gray-500 text-xs mb-2">{equipment.length} item{equipment.length !== 1 ? "s" : ""}</Text>
          ) : null
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-dark-card rounded-t-3xl p-5 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-bold">{editingId ? "Edit Equipment" : "Add Equipment"}</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); setEditingId(null); }}>
                <Ionicons name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Input label="Name" value={form.name} onChangeText={update("name")} placeholder="e.g. Lat Pulldown" />
            <Input label="Brand" value={form.brand} onChangeText={update("brand")} placeholder="e.g. LifeFitness" />
            <Input label="Location" value={form.gymLocation} onChangeText={update("gymLocation")} placeholder="e.g. Zone A" />
            <Input label="Notes" value={form.notes} onChangeText={update("notes")} placeholder="Optional notes" />

            <Text className="text-gray-400 text-sm mb-2 ml-1">Category</Text>
            <View className="flex-row flex-wrap mb-4">
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => update("category")(c)}
                  className={`px-3 py-2 rounded-lg mr-2 mb-2 ${form.category === c ? "bg-primary" : "bg-dark"}`}
                >
                  <Text className={`text-xs capitalize ${form.category === c ? "text-white" : "text-gray-400"}`}>
                    {c.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title={editingId ? "Save Changes" : "Add Equipment"} onPress={saveEquipment} loading={saving} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
