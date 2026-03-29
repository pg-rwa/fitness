import { View, Text, ScrollView, TouchableOpacity, Alert, Image, FlatList, Modal, Dimensions, ActivityIndicator } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, StatCard, SectionHeader, Button, Input, PullToRefresh, EmptyState, Badge } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatWeight } from "../../../lib/format";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { resizeImageIfNeeded } from "../../../lib/image";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://64.227.187.54:3080/api";
const CATEGORIES = ["front", "side", "back", "flexed", "custom"];
const screenWidth = Dimensions.get("window").width;
const photoSize = (screenWidth - 40 - 8) / 3; // 3 columns, 20px padding each side, 4px gap

// ─── Photo Upload Modal ────────────────────────────────────
function PhotoUploadModal({ visible, onSave, onClose }) {
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState("front");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const resizedUri = await resizeImageIfNeeded(asset.uri, { width: asset.width, height: asset.height });
      setImage({ ...asset, uri: resizedUri });
      setError(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to take photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const resizedUri = await resizeImageIfNeeded(asset.uri, { width: asset.width, height: asset.height });
      setImage({ ...asset, uri: resizedUri });
      setError(null);
    }
  };

  const upload = async () => {
    if (!image) return;
    setUploading(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync("token");
      const formData = new FormData();
      const uri = image.uri;
      const filename = uri.split("/").pop() || "photo.jpg";
      const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";

      formData.append("photo", { uri, name: filename, type: mimeType });
      formData.append("category", category);
      if (notes.trim()) formData.append("notes", notes.trim());

      const res = await fetch(`${API_URL}/progress/photos/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      setImage(null);
      setNotes("");
      setCategory("front");
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-dark/95">
        <View className="flex-1 bg-dark mt-12 rounded-t-3xl border-t border-gray-700">
          <ScrollView className="flex-1 px-5 pt-5">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-white text-xl font-bold">Upload Photo</Text>
              <TouchableOpacity onPress={onClose} className="bg-dark-card rounded-full p-2">
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Image preview or picker */}
            {!image ? (
              <View className="mb-4">
                <TouchableOpacity
                  onPress={pickImage}
                  className="border-2 border-dashed border-gray-600 rounded-2xl items-center justify-center py-12 mb-3"
                  activeOpacity={0.7}
                >
                  <Ionicons name="images-outline" size={40} color="#6B7280" />
                  <Text className="text-gray-400 text-sm mt-3">Choose from library</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={takePhoto}
                  className="bg-dark-card border border-gray-700 rounded-2xl items-center justify-center py-4 flex-row"
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={22} color="#E8614D" />
                  <Text className="text-primary font-semibold ml-2">Take Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="mb-4">
                <View className="rounded-2xl overflow-hidden bg-black">
                  <Image source={{ uri: image.uri }} style={{ width: "100%", height: 300 }} resizeMode="contain" />
                </View>
                <TouchableOpacity
                  onPress={() => setImage(null)}
                  className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5"
                >
                  <Ionicons name="close" size={18} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {/* Category selector */}
            <Text className="text-gray-400 text-xs mb-2 ml-1">Category</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  className={`px-4 py-2 rounded-full ${category === c ? "bg-primary" : "bg-dark-card border border-gray-700"}`}
                >
                  <Text className={`text-sm capitalize font-medium ${category === c ? "text-white" : "text-gray-400"}`}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Input
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Week 4 check-in"
            />

            {error && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3">
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            )}

            <View className="flex-row gap-3 mb-8">
              <TouchableOpacity onPress={onClose} className="flex-1 bg-dark-card border border-gray-700 rounded-xl py-3 items-center">
                <Text className="text-gray-400 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={upload}
                disabled={!image || uploading}
                className={`flex-1 rounded-xl py-3 items-center ${!image || uploading ? "bg-primary/50" : "bg-primary"}`}
              >
                {uploading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-semibold">Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Photo Lightbox ────────────────────────────────────────
function PhotoLightbox({ photo, onClose, onDelete }) {
  if (!photo) return null;
  return (
    <Modal visible={!!photo} animationType="fade" transparent>
      <View className="flex-1 bg-black/95 justify-center">
        <TouchableOpacity onPress={onClose} className="absolute top-14 right-5 z-10 bg-white/10 rounded-full p-2">
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        <Image
          source={{ uri: photo.photo_url }}
          style={{ width: screenWidth, height: screenWidth * 1.3 }}
          resizeMode="contain"
        />

        <View className="px-5 mt-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-primary text-xs uppercase font-semibold">{photo.category}</Text>
              {photo.notes && <Text className="text-gray-400 text-sm mt-1">{photo.notes}</Text>}
            </View>
            <Text className="text-gray-600 text-xs">
              {new Date(photo.taken_at || photo.created_at).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onDelete(photo.id)}
            className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl py-3 items-center"
          >
            <Text className="text-red-400 font-medium">Delete Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Photos Tab ────────────────────────────────────────────
function PhotosTab() {
  const [photos, setPhotos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const qs = filter !== "all" ? `?category=${filter}` : "";
      const data = await api(`/progress/photos${qs}`);
      setPhotos(data.data || data || []);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const deletePhoto = async (id) => {
    Alert.alert("Delete Photo", "Are you sure you want to delete this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/progress/photos/${id}`, { method: "DELETE" });
            setPhotos((prev) => prev.filter((p) => p.id !== id));
            setSelected(null);
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  return (
    <>
      {/* Category filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={["all", ...CATEGORIES]}
        keyExtractor={(item) => item}
        contentContainerStyle={{ gap: 6, marginBottom: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setFilter(item)}
            className={`px-3 py-1.5 rounded-full ${
              filter === item ? "bg-primary" : "bg-dark-card border border-gray-700"
            }`}
          >
            <Text className={`text-xs font-semibold capitalize ${filter === item ? "text-white" : "text-gray-400"}`}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View className="items-center py-12">
          <ActivityIndicator size="large" color="#E8614D" />
        </View>
      ) : photos.length > 0 ? (
        <View className="flex-row flex-wrap" style={{ gap: 4 }}>
          {photos.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => setSelected(p)} activeOpacity={0.8}>
              <View style={{ width: photoSize, height: photoSize, borderRadius: 12, overflow: "hidden", backgroundColor: "#2A2A3E" }}>
                <Image
                  source={{ uri: p.thumbnail_url || p.photo_url }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingHorizontal: 6,
                    paddingVertical: 4,
                    backgroundColor: "rgba(0,0,0,0.6)",
                  }}
                >
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 9, textTransform: "capitalize" }}>
                    {p.category}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 8 }}>
                    {new Date(p.taken_at || p.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View className="items-center py-12">
          <Ionicons name="camera-outline" size={48} color="#6B7280" />
          <Text className="text-gray-400 text-sm mt-3 mb-4">No photos yet</Text>
          <Button title="Upload your first photo" onPress={() => setShowUpload(true)} />
        </View>
      )}

      {/* Upload FAB */}
      {photos.length > 0 && (
        <TouchableOpacity
          onPress={() => setShowUpload(true)}
          className="absolute bottom-6 right-5 bg-primary rounded-full items-center justify-center"
          style={{ width: 56, height: 56, elevation: 5, shadowColor: "#E8614D", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 }}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={26} color="white" />
        </TouchableOpacity>
      )}

      <PhotoUploadModal
        visible={showUpload}
        onSave={() => {
          setShowUpload(false);
          loadPhotos();
        }}
        onClose={() => setShowUpload(false)}
      />
      <PhotoLightbox photo={selected} onClose={() => setSelected(null)} onDelete={deletePhoto} />
    </>
  );
}

// ─── Main Progress Screen ──────────────────────────────────
export default function ProgressScreen() {
  const [latest, setLatest] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [showRecord, setShowRecord] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("measurements");

  const loadData = useCallback(async () => {
    try {
      const [latestData, listData] = await Promise.all([
        api("/progress/measurements/latest"),
        api("/progress/measurements?limit=10"),
      ]);
      setLatest(latestData);
      setMeasurements(listData.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const update = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  const saveMeasurement = async () => {
    setSaving(true);
    try {
      const body = {};
      if (form.weightKg) body.weightKg = parseFloat(form.weightKg);
      if (form.bodyFatPct) body.bodyFatPct = parseFloat(form.bodyFatPct);
      if (form.chestCm) body.chestCm = parseFloat(form.chestCm);
      if (form.waistCm) body.waistCm = parseFloat(form.waistCm);
      if (form.hipsCm) body.hipsCm = parseFloat(form.hipsCm);
      if (form.bicepLeftCm) body.bicepLeftCm = parseFloat(form.bicepLeftCm);
      if (form.bicepRightCm) body.bicepRightCm = parseFloat(form.bicepRightCm);
      if (form.notes) body.notes = form.notes;

      await api("/progress/measurements", { method: "POST", body });
      setShowRecord(false);
      setForm({});
      await loadData();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Record Measurements Form ──
  if (showRecord) {
    return (
      <SafeAreaView className="flex-1 bg-dark">
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between mt-2 mb-4">
            <TouchableOpacity onPress={() => setShowRecord(false)}>
              <Text className="text-primary text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold">Record Measurements</Text>
            <View style={{ width: 50 }} />
          </View>

          <Input label="Weight (kg)" value={form.weightKg} onChangeText={update("weightKg")} keyboardType="decimal-pad" icon="scale-outline" />
          <Input label="Body Fat (%)" value={form.bodyFatPct} onChangeText={update("bodyFatPct")} keyboardType="decimal-pad" icon="body-outline" />
          <Input label="Chest (cm)" value={form.chestCm} onChangeText={update("chestCm")} keyboardType="decimal-pad" />
          <Input label="Waist (cm)" value={form.waistCm} onChangeText={update("waistCm")} keyboardType="decimal-pad" />
          <Input label="Hips (cm)" value={form.hipsCm} onChangeText={update("hipsCm")} keyboardType="decimal-pad" />
          <Input label="Left Bicep (cm)" value={form.bicepLeftCm} onChangeText={update("bicepLeftCm")} keyboardType="decimal-pad" />
          <Input label="Right Bicep (cm)" value={form.bicepRightCm} onChangeText={update("bicepRightCm")} keyboardType="decimal-pad" />
          <Input label="Notes" value={form.notes} onChangeText={update("notes")} placeholder="Optional notes" />

          <Button title="Save Measurement" onPress={saveMeasurement} loading={saving} className="mb-8" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-5 pt-2">
        <Text className="text-white text-2xl font-bold mb-3">Progress</Text>

        {/* Tab Switcher — matching web app */}
        <View className="flex-row mb-4 bg-dark-card rounded-xl p-1">
          {[
            { key: "measurements", label: "Measurements" },
            { key: "photos", label: "Photos" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg items-center ${tab === t.key ? "bg-primary" : ""}`}
            >
              <Text className={`font-semibold ${tab === t.key ? "text-white" : "text-gray-400"}`}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === "measurements" ? (
        <PullToRefresh onRefresh={loadData}>
          <View className="px-5 pb-8">
            {/* Current stats */}
            {latest && (
              <View className="flex-row mb-2">
                <StatCard label="Weight" value={latest.weight_kg || "-"} unit="kg" icon="scale" color="#E8614D" />
                <StatCard label="Body Fat" value={latest.body_fat_pct || "-"} unit="%" icon="body" color="#10B981" />
              </View>
            )}

            <Button title="Record Measurements" icon="add-circle" onPress={() => setShowRecord(true)} className="mt-2" />

            {/* Measurement History */}
            <SectionHeader title="History" />
            {measurements.length === 0 ? (
              <EmptyState icon="analytics-outline" title="No measurements" message="Record your first measurement to track progress" />
            ) : (
              measurements.map((m) => (
                <Card key={m.id}>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-white font-semibold">{formatDate(m.recorded_at)}</Text>
                      {m.notes && <Text className="text-gray-400 text-xs mt-0.5">{m.notes}</Text>}
                    </View>
                    <View className="items-end">
                      {m.weight_kg && <Text className="text-white font-bold">{formatWeight(m.weight_kg)}</Text>}
                      {m.body_fat_pct && <Text className="text-gray-400 text-xs">{m.body_fat_pct}% BF</Text>}
                    </View>
                  </View>
                  <View className="flex-row flex-wrap mt-2">
                    {m.chest_cm && <Text className="text-gray-500 text-xs mr-3">Chest: {m.chest_cm}cm</Text>}
                    {m.waist_cm && <Text className="text-gray-500 text-xs mr-3">Waist: {m.waist_cm}cm</Text>}
                    {m.hips_cm && <Text className="text-gray-500 text-xs mr-3">Hips: {m.hips_cm}cm</Text>}
                  </View>
                </Card>
              ))
            )}
          </View>
        </PullToRefresh>
      ) : (
        <View className="flex-1 px-5">
          <PhotosTab />
        </View>
      )}
    </SafeAreaView>
  );
}
