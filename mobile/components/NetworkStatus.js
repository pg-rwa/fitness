import { View, Text } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

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
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className="bg-yellow-600 py-2 px-4 flex-row items-center justify-center"
    >
      <Ionicons name="cloud-offline" size={16} color="white" />
      <Text className="text-white text-sm font-medium ml-2">No internet connection</Text>
    </Animated.View>
  );
}
