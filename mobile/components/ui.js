import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export function Button({ title, onPress, variant = "primary", loading, disabled, icon, className = "" }) {
  const base = "flex-row items-center justify-center rounded-xl py-3.5 px-6";
  const variants = {
    primary: "bg-primary",
    secondary: "bg-dark-card border border-gray-600",
    danger: "bg-red-600",
    ghost: "bg-transparent",
  };
  const textVariants = {
    primary: "text-white font-semibold text-base",
    secondary: "text-white font-semibold text-base",
    danger: "text-white font-semibold text-base",
    ghost: "text-primary font-semibold text-base",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      className={`${base} ${variants[variant]} ${disabled ? "opacity-50" : ""} ${className}`}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color="white" style={{ marginRight: 8 }} />}
          <Text className={textVariants[variant]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, error, icon, className = "" }) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={`mb-4 ${className}`}>
      {label && <Text className="text-gray-400 text-sm mb-1.5 ml-1">{label}</Text>}
      <View
        className={`flex-row items-center bg-dark-card rounded-xl px-4 border ${
          error ? "border-red-500" : focused ? "border-primary" : "border-transparent"
        }`}
      >
        {icon && <Ionicons name={icon} size={20} color="#6B7280" style={{ marginRight: 10 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 text-white text-base py-3.5"
        />
      </View>
      {error && <Text className="text-red-400 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
}

export function Card({ children, className = "", onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className={`bg-dark-card rounded-2xl p-4 mb-3 ${className}`}
    >
      {children}
    </Wrapper>
  );
}

export function Badge({ text, color = "primary", className = "" }) {
  const colors = {
    primary: "bg-primary/20 text-primary",
    green: "bg-green-500/20 text-green-400",
    yellow: "bg-yellow-500/20 text-yellow-400",
    red: "bg-red-500/20 text-red-400",
    gray: "bg-gray-500/20 text-gray-400",
    blue: "bg-blue-500/20 text-blue-400",
  };

  return (
    <View className={`rounded-full px-3 py-1 self-start ${colors[color]?.split(" ")[0]} ${className}`}>
      <Text className={`text-xs font-medium ${colors[color]?.split(" ")[1]}`}>{text}</Text>
    </View>
  );
}

export function StatCard({ label, value, unit, icon, color = "#E8614D" }) {
  return (
    <View className="bg-dark-card rounded-2xl p-4 flex-1 mx-1">
      <View className="flex-row items-center mb-2">
        <Ionicons name={icon} size={18} color={color} />
        <Text className="text-gray-400 text-xs ml-1.5">{label}</Text>
      </View>
      <Text className="text-white text-xl font-bold">
        {value}
        {unit && <Text className="text-gray-400 text-sm font-normal"> {unit}</Text>}
      </Text>
    </View>
  );
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <View className="items-center justify-center py-12 px-6">
      <Ionicons name={icon} size={48} color="#6B7280" />
      <Text className="text-white text-lg font-semibold mt-4">{title}</Text>
      <Text className="text-gray-400 text-center mt-2">{message}</Text>
      {action}
    </View>
  );
}

export function LoadingScreen() {
  return (
    <View className="flex-1 bg-dark items-center justify-center">
      <ActivityIndicator size="large" color="#E8614D" />
    </View>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <View className="flex-row items-center justify-between mb-3 mt-5">
      <Text className="text-white text-lg font-bold">{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text className="text-primary text-sm">{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function PullToRefresh({ children, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E8614D" />}
    >
      {children}
    </ScrollView>
  );
}
