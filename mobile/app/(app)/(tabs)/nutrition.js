import { View, Text, FlatList, TouchableOpacity, Alert, Image, ActivityIndicator, Modal } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { api, apiUpload } from "../../../lib/api";
import { Card, StatCard, SectionHeader, Button, Input, EmptyState, PullToRefresh } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { resizeImageIfNeeded } from "../../../lib/image";

// ─── Barcode Scanner Modal ─────────────────────────────────
function BarcodeScannerModal({ visible, onClose, onScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
    if (visible) setScanned(false);
  }, [visible]);

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView className="flex-1 bg-dark items-center justify-center px-5">
          <Ionicons name="camera-outline" size={64} color="#6B7280" />
          <Text className="text-white text-lg font-bold mt-4">Camera Permission Required</Text>
          <Text className="text-gray-400 text-center mt-2">We need camera access to scan barcodes</Text>
          <Button title="Grant Permission" onPress={requestPermission} className="mt-6 w-full" />
          <TouchableOpacity onPress={onClose} className="mt-4">
            <Text className="text-primary text-base">Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View className="flex-1 bg-black">
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"] }}
          onBarcodeScanned={scanned ? undefined : (result) => {
            setScanned(true);
            onScanned(result.data);
          }}
        />
        {/* Overlay */}
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-64 h-64 border-2 border-white/50 rounded-3xl" />
          <Text className="text-white text-sm mt-4 font-medium">Point at a barcode</Text>
        </View>
        {/* Close button */}
        <SafeAreaView className="absolute top-0 left-0 right-0">
          <TouchableOpacity onPress={onClose} className="m-4 bg-black/50 rounded-full w-10 h-10 items-center justify-center">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>
        {scanned && (
          <View className="absolute bottom-20 left-0 right-0 items-center">
            <TouchableOpacity onPress={() => setScanned(false)} className="bg-primary px-6 py-3 rounded-xl">
              <Text className="text-white font-bold">Scan Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── AI Photo Analysis Modal ───────────────────────────────
function PhotoAnalysisModal({ visible, onClose, onAddItems }) {
  const [photo, setPhoto] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera roll access is needed to select photos.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!picked.canceled) {
      const asset = picked.assets[0];
      const resizedUri = await resizeImageIfNeeded(asset.uri, { width: asset.width, height: asset.height });
      setPhoto({ ...asset, uri: resizedUri });
      setResult(null);
      setError("");
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera access is needed to take photos.");
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!picked.canceled) {
      const asset = picked.assets[0];
      const resizedUri = await resizeImageIfNeeded(asset.uri, { width: asset.width, height: asset.height });
      setPhoto({ ...asset, uri: resizedUri });
      setResult(null);
      setError("");
    }
  };

  const analyze = async () => {
    if (!photo) return;
    setAnalyzing(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("photo", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "meal-photo.jpg",
      });
      const data = await apiUpload("/nutrition/analyze-photo", formData);
      setResult(data);
    } catch (err) {
      setError(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClose = () => {
    setPhoto(null);
    setResult(null);
    setError("");
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView className="flex-1 bg-dark px-5">
        {/* Header */}
        <View className="flex-row items-center justify-between mt-2 mb-4">
          <TouchableOpacity onPress={handleClose}>
            <Text className="text-primary text-base">Cancel</Text>
          </TouchableOpacity>
          <View className="flex-row items-center">
            <Ionicons name="sparkles" size={18} color="#E8614D" />
            <Text className="text-white text-lg font-bold ml-2">AI Meal Analysis</Text>
          </View>
          <View style={{ width: 50 }} />
        </View>

        {!photo ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="camera-outline" size={80} color="#4B5563" />
            <Text className="text-white text-lg font-bold mt-4">Snap Your Meal</Text>
            <Text className="text-gray-400 text-center mt-2 px-8">
              Take a photo or pick from gallery and AI will identify the food and estimate nutrition
            </Text>
            <View className="w-full mt-8 gap-3">
              <Button title="Take Photo" icon="camera" onPress={takePhoto} />
              <Button title="Choose from Gallery" icon="images" onPress={pickImage} variant="outline" />
            </View>
          </View>
        ) : (
          <View className="flex-1">
            {/* Photo preview */}
            <View className="rounded-2xl overflow-hidden mb-4">
              <Image source={{ uri: photo.uri }} className="w-full h-56" resizeMode="cover" />
            </View>

            {error ? (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            ) : null}

            {analyzing ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="#E8614D" />
                <Text className="text-gray-400 mt-3">Analyzing your meal...</Text>
              </View>
            ) : result ? (
              <FlatList
                data={result.items || []}
                keyExtractor={(item, idx) => `${item.name}-${idx}`}
                ListHeaderComponent={
                  <View className="mb-3">
                    <Text className="text-white font-bold text-lg">{result.meal_name}</Text>
                    <View className="flex-row items-center mt-1">
                      <View className={`w-2 h-2 rounded-full mr-2 ${
                        result.confidence === "high" ? "bg-green-500" : result.confidence === "medium" ? "bg-yellow-500" : "bg-red-500"
                      }`} />
                      <Text className="text-gray-400 text-xs capitalize">{result.confidence} confidence</Text>
                    </View>

                    {/* Totals */}
                    <View className="flex-row mt-3 gap-2">
                      <View className="flex-1 bg-dark-card rounded-xl p-3 items-center">
                        <Text className="text-white font-bold text-lg">{Math.round(result.total_calories || 0)}</Text>
                        <Text className="text-gray-400 text-xs">Calories</Text>
                      </View>
                      <View className="flex-1 bg-dark-card rounded-xl p-3 items-center">
                        <Text className="text-green-400 font-bold">{Math.round(result.total_protein_g || 0)}g</Text>
                        <Text className="text-gray-400 text-xs">Protein</Text>
                      </View>
                      <View className="flex-1 bg-dark-card rounded-xl p-3 items-center">
                        <Text className="text-blue-400 font-bold">{Math.round(result.total_carbs_g || 0)}g</Text>
                        <Text className="text-gray-400 text-xs">Carbs</Text>
                      </View>
                      <View className="flex-1 bg-dark-card rounded-xl p-3 items-center">
                        <Text className="text-yellow-400 font-bold">{Math.round(result.total_fat_g || 0)}g</Text>
                        <Text className="text-gray-400 text-xs">Fat</Text>
                      </View>
                    </View>

                    {result.tips && (
                      <View className="bg-primary/10 rounded-xl p-3 mt-3 flex-row items-start">
                        <Ionicons name="bulb-outline" size={16} color="#E8614D" />
                        <Text className="text-gray-300 text-xs ml-2 flex-1">{result.tips}</Text>
                      </View>
                    )}

                    <Text className="text-gray-400 text-xs mt-4 mb-2">Identified Items</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View className="bg-dark-card rounded-xl p-3 mb-2 flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-white font-medium">{item.name}</Text>
                      <Text className="text-gray-400 text-xs">{item.estimated_portion}</Text>
                    </View>
                    <Text className="text-gray-300 font-semibold">{Math.round(item.calories)} cal</Text>
                  </View>
                )}
                ListFooterComponent={
                  <View className="pb-6 pt-3 gap-3">
                    <Button title="Add All to Meal Log" icon="add-circle" onPress={() => { onAddItems(result.items); handleClose(); }} />
                    <Button title="Retake Photo" icon="camera" variant="outline" onPress={() => { setPhoto(null); setResult(null); }} />
                  </View>
                }
              />
            ) : (
              <View className="gap-3">
                <Button title="Analyze with AI" icon="sparkles" onPress={analyze} />
                <Button title="Retake" icon="camera" variant="outline" onPress={() => { setPhoto(null); setResult(null); }} />
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Nutrition Screen ─────────────────────────────────
export default function NutritionScreen() {
  const [summary, setSummary] = useState(null);
  const [meals, setMeals] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [showPhotoAnalysis, setShowPhotoAnalysis] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [mealType, setMealType] = useState("lunch");
  const [logging, setLogging] = useState(false);
  const [lookingUpBarcode, setLookingUpBarcode] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    try {
      const [summaryData, mealsData] = await Promise.all([
        api(`/nutrition/summary?date=${today}`),
        api(`/nutrition/meals?date=${today}`),
      ]);
      setSummary(summaryData);
      setMeals(mealsData);
    } catch {}
  }, [today]);

  useEffect(() => { loadData(); }, [loadData]);

  const searchFoods = async (q) => {
    setSearch(q);
    if (q.length < 2) return setFoods([]);
    try {
      const data = await api(`/nutrition/foods?q=${encodeURIComponent(q)}`);
      setFoods(data.data || []);
    } catch {}
  };

  const toggleFood = (food) => {
    setSelectedFoods((prev) => {
      const exists = prev.find((f) => f.id === food.id);
      if (exists) return prev.filter((f) => f.id !== food.id);
      return [...prev, { ...food, quantity: 1 }];
    });
  };

  const logMeal = async () => {
    if (selectedFoods.length === 0) return;
    setLogging(true);
    try {
      await api("/nutrition/meals", {
        method: "POST",
        body: {
          mealType,
          items: selectedFoods.map((f) => ({ foodItemId: f.id, quantity: f.quantity })),
        },
      });
      setShowLog(false);
      setSelectedFoods([]);
      setSearch("");
      setFoods([]);
      await loadData();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLogging(false);
    }
  };

  const handleBarcodeScan = async (barcode) => {
    setShowScanner(false);
    setLookingUpBarcode(true);
    try {
      const data = await api(`/nutrition/barcode/${barcode}`);
      if (data.item) {
        setSelectedFoods((prev) => [...prev, { ...data.item, quantity: 1 }]);
        setShowLog(true);
        Alert.alert("Found!", `${data.item.name} added to your meal.`);
      }
    } catch (err) {
      Alert.alert("Not Found", err.message || "Product not found for this barcode. Try searching manually.");
    } finally {
      setLookingUpBarcode(false);
    }
  };

  const handleAIAddItems = (items) => {
    // AI returns items without IDs; we need to create food items or match existing ones
    // For now, alert the user with the analysis and suggest manual logging
    if (!items || items.length === 0) return;

    const totalCal = items.reduce((sum, i) => sum + (i.calories || 0), 0);
    const itemNames = items.map((i) => `• ${i.name} (${Math.round(i.calories)} cal)`).join("\n");

    Alert.alert(
      "Meal Analyzed!",
      `Total: ${Math.round(totalCal)} calories\n\n${itemNames}\n\nSearch for these items in the meal logger to add them.`,
      [
        { text: "Log Manually", onPress: () => setShowLog(true) },
        { text: "OK" },
      ]
    );
  };

  const targets = summary?.targets;
  const cals = Math.round(summary?.total_calories || 0);
  const targetCals = targets?.calorieTarget || 2000;
  const calPct = Math.min(100, Math.round((cals / targetCals) * 100));

  // ─── Log Meal Screen ───
  if (showLog) {
    return (
      <SafeAreaView className="flex-1 bg-dark px-5">
        <View className="flex-row items-center justify-between mt-2 mb-4">
          <TouchableOpacity onPress={() => setShowLog(false)}>
            <Text className="text-primary text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Log Meal</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Meal type */}
        <View className="flex-row mb-4">
          {["breakfast", "lunch", "dinner", "snack"].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setMealType(t)}
              className={`flex-1 py-2 rounded-lg mx-0.5 items-center ${mealType === t ? "bg-primary" : "bg-dark-card"}`}
            >
              <Text className={`text-xs font-semibold capitalize ${mealType === t ? "text-white" : "text-gray-400"}`}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI + Barcode quick actions */}
        <View className="flex-row mb-4 gap-2">
          <TouchableOpacity
            onPress={() => setShowPhotoAnalysis(true)}
            className="flex-1 bg-primary/10 border border-primary/30 rounded-xl p-3 flex-row items-center justify-center"
          >
            <Ionicons name="sparkles" size={18} color="#E8614D" />
            <Text className="text-primary font-semibold text-sm ml-2">AI Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowScanner(true)}
            className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex-row items-center justify-center"
          >
            <Ionicons name="barcode-outline" size={18} color="#3B82F6" />
            <Text className="text-blue-400 font-semibold text-sm ml-2">Scan Barcode</Text>
          </TouchableOpacity>
        </View>

        <Input
          placeholder="Search foods..."
          value={search}
          onChangeText={searchFoods}
          icon="search-outline"
        />

        {/* Selected foods */}
        {selectedFoods.length > 0 && (
          <View className="mb-3">
            <Text className="text-gray-400 text-xs mb-2">{selectedFoods.length} selected</Text>
            {selectedFoods.map((f) => (
              <View key={f.id} className="flex-row items-center justify-between bg-primary/10 rounded-lg px-3 py-2 mb-1">
                <Text className="text-white text-sm flex-1" numberOfLines={1}>{f.name}</Text>
                <Text className="text-gray-400 text-xs mr-3">{f.calories} cal</Text>
                <TouchableOpacity onPress={() => toggleFood(f)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <FlatList
          data={foods}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const isSelected = selectedFoods.some((f) => f.id === item.id);
            return (
              <TouchableOpacity
                onPress={() => toggleFood(item)}
                className={`flex-row items-center p-3 rounded-xl mb-1 ${isSelected ? "bg-primary/20" : "bg-dark-card"}`}
              >
                <View className="flex-1">
                  <Text className="text-white text-sm font-medium">{item.name}</Text>
                  <Text className="text-gray-400 text-xs">{item.serving_size}{item.serving_unit} | P:{item.protein_g}g C:{item.carbs_g}g F:{item.fat_g}g</Text>
                </View>
                <Text className="text-gray-300 text-sm font-semibold">{item.calories} cal</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            search.length >= 2 ? (
              <Text className="text-gray-500 text-center mt-4">No foods found</Text>
            ) : (
              <Text className="text-gray-500 text-center mt-4">Search for a food to add</Text>
            )
          }
        />

        {selectedFoods.length > 0 && (
          <View className="pb-6 pt-3">
            <Button title={`Log ${mealType}`} onPress={logMeal} loading={logging} />
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ─── Main Nutrition View ───
  return (
    <SafeAreaView className="flex-1 bg-dark">
      <PullToRefresh onRefresh={loadData}>
        <View className="px-5 pb-8">
          <Text className="text-white text-2xl font-bold mt-2 mb-4">Nutrition</Text>

          {/* Calorie ring */}
          <Card className="items-center py-5">
            <Text className="text-gray-400 text-sm">Daily Calories</Text>
            <Text className="text-white text-4xl font-bold mt-1">{cals}</Text>
            <Text className="text-gray-400 text-sm">of {targetCals} kcal ({calPct}%)</Text>
            <View className="w-full bg-gray-700 h-2 rounded-full mt-3 mx-4">
              <View className="bg-primary h-2 rounded-full" style={{ width: `${calPct}%` }} />
            </View>
          </Card>

          {/* Macro breakdown */}
          <View className="flex-row mt-1">
            <StatCard label="Protein" value={Math.round(summary?.total_protein_g || 0)} unit="g" icon="fitness" color="#10B981" />
            <StatCard label="Carbs" value={Math.round(summary?.total_carbs_g || 0)} unit="g" icon="flash" color="#3B82F6" />
            <StatCard label="Fat" value={Math.round(summary?.total_fat_g || 0)} unit="g" icon="water" color="#F59E0B" />
          </View>

          {/* Quick Actions */}
          <View className="flex-row mt-4 gap-2">
            <TouchableOpacity
              onPress={() => setShowLog(true)}
              className="flex-1 bg-primary rounded-2xl p-4 items-center"
            >
              <Ionicons name="add-circle" size={28} color="white" />
              <Text className="text-white font-bold text-sm mt-1">Log Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPhotoAnalysis(true)}
              className="flex-1 bg-dark-card rounded-2xl p-4 items-center border border-gray-700"
            >
              <Ionicons name="sparkles" size={28} color="#E8614D" />
              <Text className="text-white font-bold text-sm mt-1">AI Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowScanner(true)}
              className="flex-1 bg-dark-card rounded-2xl p-4 items-center border border-gray-700"
            >
              <Ionicons name="barcode-outline" size={28} color="#3B82F6" />
              <Text className="text-white font-bold text-sm mt-1">Scan</Text>
            </TouchableOpacity>
          </View>

          {lookingUpBarcode && (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className="text-gray-400 text-sm mt-2">Looking up barcode...</Text>
            </View>
          )}

          {/* Today's meals */}
          <SectionHeader title="Today's Meals" />
          {meals.length === 0 ? (
            <EmptyState icon="restaurant-outline" title="No meals logged" message="Tap 'Log Meal' to get started" />
          ) : (
            meals.map((meal) => {
              const totalCal = meal.items?.reduce((sum, i) => sum + (i.calories || 0), 0) || 0;
              return (
                <Card key={meal.id}>
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-white font-semibold capitalize">{meal.meal_type}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">{meal.items?.length || 0} items</Text>
                    </View>
                    <Text className="text-white font-bold">{Math.round(totalCal)} cal</Text>
                  </View>
                  {meal.items?.map((item, idx) => (
                    <View key={idx} className="flex-row justify-between mt-2 pl-2 border-l-2 border-gray-700">
                      <Text className="text-gray-300 text-sm">{item.food_name}</Text>
                      <Text className="text-gray-400 text-xs">{Math.round(item.calories)} cal</Text>
                    </View>
                  ))}
                </Card>
              );
            })
          )}
        </View>
      </PullToRefresh>

      {/* Modals */}
      <PhotoAnalysisModal
        visible={showPhotoAnalysis}
        onClose={() => setShowPhotoAnalysis(false)}
        onAddItems={handleAIAddItems}
      />
      <BarcodeScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={handleBarcodeScan}
      />
    </SafeAreaView>
  );
}
