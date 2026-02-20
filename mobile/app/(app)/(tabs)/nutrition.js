import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { Card, StatCard, SectionHeader, Button, Input, EmptyState, PullToRefresh } from "../../../components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function NutritionScreen() {
  const [summary, setSummary] = useState(null);
  const [meals, setMeals] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [mealType, setMealType] = useState("lunch");
  const [logging, setLogging] = useState(false);

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

  const targets = summary?.targets;
  const cals = Math.round(summary?.total_calories || 0);
  const targetCals = targets?.calorieTarget || 2000;
  const calPct = Math.min(100, Math.round((cals / targetCals) * 100));

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
                <Text className="text-white text-sm flex-1">{f.name}</Text>
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

          <Button title="Log a Meal" icon="add-circle" onPress={() => setShowLog(true)} className="mt-4" />

          {/* Today's meals */}
          <SectionHeader title="Today's Meals" />
          {meals.length === 0 ? (
            <EmptyState icon="restaurant-outline" title="No meals logged" message="Tap 'Log a Meal' to get started" />
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
    </SafeAreaView>
  );
}
