import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, StatCard, SectionHeader, Button, Input, PullToRefresh, EmptyState } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatWeight } from "../../../lib/format";

export default function ProgressScreen() {
  const [latest, setLatest] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [showRecord, setShowRecord] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

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

  useEffect(() => { loadData(); }, [loadData]);

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
      <PullToRefresh onRefresh={loadData}>
        <View className="px-5 pb-8">
          <Text className="text-white text-2xl font-bold mt-2 mb-4">Progress</Text>

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
    </SafeAreaView>
  );
}
