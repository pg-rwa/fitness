import { View, Text } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let unsubscribe;
    try {
      const NetInfo = require("@react-native-community/netinfo").default;
      unsubscribe = NetInfo.addEventListener((state) => {
        setIsOnline(state.isConnected && state.isInternetReachable !== false);
      });
    } catch {}
    return () => unsubscribe?.();
  }, []);

  if (isOnline) return null;

  return (
    <View className="bg-yellow-600 py-2 px-4 flex-row items-center justify-center">
      <Ionicons name="cloud-offline" size={16} color="white" />
      <Text className="text-white text-sm font-medium ml-2">No internet connection</Text>
    </View>
  );
}
