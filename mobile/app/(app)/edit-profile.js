import { View, Text, TouchableOpacity, ScrollView, Alert, Image, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { Input, Button, Card } from "../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://64.227.187.54:3080/api";

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "", lastName: "",
    phone: "", bio: "", address: "", timezone: "",
    heightCm: "", weightKg: "", dateOfBirth: "", gender: "", fitnessLevel: "",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/users/me")
      .then((d) => {
        const u = d.user || d;
        const p = u.profile || {};
        setForm({
          firstName: u.first_name || "",
          lastName: u.last_name || "",
          phone: p.phone || "",
          bio: p.bio || "",
          address: p.address || "",
          timezone: p.timezone || "",
          heightCm: p.height_cm ? String(p.height_cm) : "",
          weightKg: p.weight_kg ? String(p.weight_kg) : "",
          dateOfBirth: p.date_of_birth || "",
          gender: p.gender || "",
          fitnessLevel: p.fitness_level || "",
        });
        setAvatarUrl(p.avatar_url || null);
      })
      .catch(() => {});
  }, []);

  const update = (key) => (val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setSaved(false);
    setError("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await api("/users/me/profile", { method: "PUT", body: form });
      if (refreshUser) await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      const ImagePicker = require("expo-image-picker");
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant photo library access to upload an avatar.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploading(true);
      setError("");
      const asset = result.assets[0];
      const uri = asset.uri;
      const filename = uri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : "jpg";
      const mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;

      const fd = new FormData();
      fd.append("avatar", { uri, name: filename, type: mimeType });

      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.avatar_url);
      if (refreshUser) await refreshUser();
    } catch (err) {
      if (err.message?.includes("Cannot find module")) {
        Alert.alert("Missing dependency", "expo-image-picker is not installed. Run: npx expo install expo-image-picker");
      } else {
        setError(err.message || "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    Alert.alert("Remove Photo", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await api("/users/me/avatar", { method: "DELETE" });
            setAvatarUrl(null);
            if (refreshUser) await refreshUser();
          } catch (err) {
            setError(err.message || "Failed to remove");
          }
        },
      },
    ]);
  };

  const initials =
    ((form.firstName?.[0] || "") + (form.lastName?.[0] || "")).toUpperCase() || "?";

  const genderOptions = ["", "male", "female", "other"];
  const fitnessOptions = ["", "beginner", "intermediate", "advanced"];

  const cycleOption = (key, options) => {
    const idx = options.indexOf(form[key]);
    const next = options[(idx + 1) % options.length];
    setForm((f) => ({ ...f, [key]: next }));
    setSaved(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between pt-2 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Edit Profile</Text>
          <View style={{ width: 32 }} />
        </View>

        {error ? (
          <View className="bg-red-500/10 rounded-xl p-3 mb-4">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        ) : null}

        {/* Avatar */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
                className="border-2 border-gray-700"
              />
            ) : (
              <View
                style={{ width: 100, height: 100, borderRadius: 50 }}
                className="bg-primary/20 border-2 border-gray-700 items-center justify-center"
              >
                <Text className="text-primary text-3xl font-bold">{initials}</Text>
              </View>
            )}
            <View
              className="absolute bottom-0 right-0 bg-primary rounded-full p-2"
              style={{ elevation: 4 }}
            >
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          {uploading && <Text className="text-gray-400 text-xs mt-2">Uploading...</Text>}
          {avatarUrl && (
            <TouchableOpacity onPress={removeAvatar} className="mt-2">
              <Text className="text-red-400 text-xs">Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account */}
        <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
          Account
        </Text>
        <View className="flex-row gap-2 mb-0">
          <View className="flex-1">
            <Input
              label="First Name"
              value={form.firstName}
              onChangeText={update("firstName")}
              icon="person-outline"
            />
          </View>
          <View className="flex-1">
            <Input
              label="Last Name"
              value={form.lastName}
              onChangeText={update("lastName")}
              icon="person-outline"
            />
          </View>
        </View>

        <View className="bg-dark-card rounded-xl px-4 py-3.5 mb-4 flex-row items-center">
          <Ionicons name="mail-outline" size={20} color="#6B7280" style={{ marginRight: 10 }} />
          <View className="flex-1">
            <Text className="text-gray-500 text-xs">Email</Text>
            <Text className="text-gray-400 text-base">{user?.email || ""}</Text>
          </View>
        </View>

        {/* Contact */}
        <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 ml-1 mt-2">
          Contact
        </Text>
        <Input
          label="Phone"
          value={form.phone}
          onChangeText={update("phone")}
          placeholder="+1 (555) 000-0000"
          keyboardType="phone-pad"
          icon="call-outline"
        />
        <Input
          label="Address"
          value={form.address}
          onChangeText={update("address")}
          placeholder="Street, City, State, ZIP"
          icon="location-outline"
        />
        <Input
          label="Timezone"
          value={form.timezone}
          onChangeText={update("timezone")}
          placeholder="e.g. America/New_York"
          icon="time-outline"
        />

        {/* Bio */}
        <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 ml-1 mt-2">
          About
        </Text>
        <Input
          label="Bio"
          value={form.bio}
          onChangeText={update("bio")}
          placeholder="Tell us about yourself..."
          icon="chatbubble-outline"
        />

        {/* Physical */}
        <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 ml-1 mt-2">
          Physical
        </Text>
        <View className="flex-row gap-2 mb-0">
          <View className="flex-1">
            <Input
              label="Height (cm)"
              value={form.heightCm}
              onChangeText={update("heightCm")}
              keyboardType="numeric"
              icon="resize-outline"
            />
          </View>
          <View className="flex-1">
            <Input
              label="Weight (kg)"
              value={form.weightKg}
              onChangeText={update("weightKg")}
              keyboardType="numeric"
              icon="barbell-outline"
            />
          </View>
        </View>

        <Input
          label="Date of Birth"
          value={form.dateOfBirth}
          onChangeText={update("dateOfBirth")}
          placeholder="YYYY-MM-DD"
          icon="calendar-outline"
        />

        {/* Gender - tap to cycle */}
        <TouchableOpacity
          onPress={() => cycleOption("gender", genderOptions)}
          className="bg-dark-card rounded-xl px-4 py-3.5 mb-4 flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="transgender-outline" size={20} color="#6B7280" style={{ marginRight: 10 }} />
          <View className="flex-1">
            <Text className="text-gray-400 text-xs mb-0.5">Gender</Text>
            <Text className="text-white text-base capitalize">
              {form.gender || "Not set"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6B7280" />
        </TouchableOpacity>

        {/* Fitness Level - tap to cycle */}
        <TouchableOpacity
          onPress={() => cycleOption("fitnessLevel", fitnessOptions)}
          className="bg-dark-card rounded-xl px-4 py-3.5 mb-4 flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="fitness-outline" size={20} color="#6B7280" style={{ marginRight: 10 }} />
          <View className="flex-1">
            <Text className="text-gray-400 text-xs mb-0.5">Fitness Level</Text>
            <Text className="text-white text-base capitalize">
              {form.fitnessLevel || "Not set"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6B7280" />
        </TouchableOpacity>

        {/* Save */}
        <Button
          title={saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
          onPress={save}
          loading={saving}
          variant={saved ? "secondary" : "primary"}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
