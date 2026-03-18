import { View, Text, TouchableOpacity, Vibration } from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";

const PRESETS = [30, 60, 90, 120, 180];

export function RestTimer({ onDismiss }) {
  const [seconds, setSeconds] = useState(90);
  const [remaining, setRemaining] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (remaining === 0 && isRunning) {
      setIsRunning(false);
      clearInterval(intervalRef.current);
      Vibration.vibrate([0, 300, 150, 300]);
      try {
        const Haptics = require("expo-haptics");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
  }, [remaining, isRunning]);

  const start = useCallback(() => {
    setRemaining(seconds);
    setIsRunning(true);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setRemaining(null);
    clearInterval(intervalRef.current);
  }, []);

  const addTime = useCallback((s) => {
    setRemaining((prev) => (prev || 0) + s);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = remaining !== null ? remaining / seconds : 1;
  const timerDone = remaining === 0 && !isRunning;

  return (
    <View className="bg-dark-card rounded-2xl p-4 mb-4 border border-gray-700">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name="timer-outline" size={20} color="#F59E0B" />
          <Text className="text-white font-semibold ml-2">Rest Timer</Text>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Timer display */}
      <View className="items-center my-4">
        <Text
          className={`text-5xl font-bold ${timerDone ? "text-green-400" : isRunning ? "text-white" : "text-gray-400"}`}
        >
          {remaining !== null ? formatTime(remaining) : formatTime(seconds)}
        </Text>
        {timerDone && <Text className="text-green-400 text-sm mt-1">Rest complete!</Text>}
        {isRunning && (
          <View className="w-full h-1.5 bg-gray-700 rounded-full mt-3 overflow-hidden">
            <View
              className="h-full bg-accent rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
        )}
      </View>

      {/* Preset buttons */}
      {!isRunning && remaining === null && (
        <View className="flex-row justify-center gap-2 mb-3">
          {PRESETS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSeconds(s)}
              className={`rounded-lg px-3 py-1.5 ${seconds === s ? "bg-accent/30" : "bg-gray-700/50"}`}
              activeOpacity={0.7}
            >
              <Text className={`text-sm font-medium ${seconds === s ? "text-accent" : "text-gray-400"}`}>
                {s < 60 ? `${s}s` : `${s / 60}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Controls */}
      <View className="flex-row justify-center gap-3">
        {isRunning ? (
          <>
            <TouchableOpacity
              onPress={() => addTime(15)}
              className="bg-gray-700/50 rounded-xl py-2.5 px-4 flex-row items-center"
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color="#F59E0B" />
              <Text className="text-accent font-medium ml-1">15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={stop}
              className="bg-red-600/20 rounded-xl py-2.5 px-6"
              activeOpacity={0.7}
            >
              <Text className="text-red-400 font-semibold">Stop</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={timerDone ? stop : start}
            className="bg-accent/20 rounded-xl py-2.5 px-8"
            activeOpacity={0.7}
          >
            <Text className="text-accent font-semibold">{timerDone ? "Reset" : "Start Rest"}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
