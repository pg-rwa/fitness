import { View, Text, TextInput, TouchableOpacity, Modal, Alert } from "react-native";
import { useState, useRef, useCallback, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../lib/api";
import PeqoMascot from "./PeqoMascot";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";

/**
 * VoiceCommand — floating action button + voice interaction overlay.
 *
 * Since expo-av / expo-speech aren't installed, this uses a text-input fallback
 * for voice commands. The architecture supports swapping in real speech-to-text
 * when the native modules are added.
 *
 * Props:
 *   visible   — controls FAB visibility
 *   sessionId — optional active workout session ID (for context)
 */
export default function VoiceCommand({ visible = true, sessionId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [peqoMood, setPeqoMood] = useState("idle");
  const [peqoMessage, setPeqoMessage] = useState(null);
  const [commandText, setCommandText] = useState("");
  const [history, setHistory] = useState([]);

  // Pulse animation for the FAB when listening
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (listening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [listening]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Load Peqo's mood on open
  const loadMood = useCallback(async () => {
    try {
      const data = await api("/voice/mood");
      setPeqoMood(data.mood);
      setPeqoMessage(data.message);
    } catch {
      setPeqoMood("idle");
      setPeqoMessage("Hey! What's up?");
    }
  }, []);

  const openModal = () => {
    setModalOpen(true);
    loadMood();
  };

  // Send a command to the voice API
  const sendCommand = useCallback(
    async (text) => {
      if (!text?.trim()) return;

      setProcessing(true);
      setPeqoMood("thinking");
      setPeqoMessage(null);

      try {
        const data = await api("/voice/command", {
          method: "POST",
          body: { command: text.trim() },
        });

        setPeqoMood(data.mood || "happy");
        setPeqoMessage(data.response);
        setHistory((prev) => [
          { id: Date.now(), command: text.trim(), response: data.response, action: data.action },
          ...prev.slice(0, 9),
        ]);

        // If workout was completed, close after a moment
        if (data.action === "complete_workout") {
          setTimeout(() => setModalOpen(false), 2000);
        }
      } catch (err) {
        setPeqoMood("concerned");
        setPeqoMessage("Hmm, something went wrong. Try again?");
      } finally {
        setProcessing(false);
        setCommandText("");
      }
    },
    []
  );

  // Quick command buttons
  const quickCommands = [
    { label: "Done", icon: "checkmark-circle", command: "Done" },
    { label: "Skip", icon: "play-skip-forward", command: "Skip this exercise" },
    { label: "Status", icon: "stats-chart", command: "How am I doing?" },
    { label: "Finish", icon: "flag", command: "I'm done" },
  ];

  if (!visible) return null;

  return (
    <>
      {/* Floating Action Button */}
      <Animated.View
        style={[
          pulseStyle,
          {
            position: "absolute",
            bottom: 24,
            right: 20,
            zIndex: 100,
          },
        ]}
      >
        <TouchableOpacity
          onPress={openModal}
          activeOpacity={0.8}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#E8614D",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#E8614D",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="mic" size={26} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Voice Interaction Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent statusBarTranslucent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "flex-end",
          }}
        >
          {/* Top close button */}
          <TouchableOpacity
            onPress={() => setModalOpen(false)}
            style={{
              position: "absolute",
              top: 60,
              right: 20,
              zIndex: 10,
              padding: 8,
            }}
          >
            <Ionicons name="close" size={28} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          {/* Peqo mascot centered */}
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
            <PeqoMascot mood={peqoMood} size={140} message={peqoMessage} />
          </View>

          {/* Interaction panel */}
          <View
            style={{
              backgroundColor: "#1E1E2E",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 40,
            }}
          >
            {/* Quick commands */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 16 }}>
              {quickCommands.map((qc) => (
                <TouchableOpacity
                  key={qc.label}
                  onPress={() => sendCommand(qc.command)}
                  disabled={processing}
                  style={{
                    alignItems: "center",
                    opacity: processing ? 0.5 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "rgba(232, 97, 77, 0.15)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Ionicons name={qc.icon} size={22} color="#E8614D" />
                  </View>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{qc.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Text input fallback (until speech-to-text is added) */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 16,
                paddingHorizontal: 16,
                alignItems: "center",
              }}
            >
              <Ionicons name="chatbubble-outline" size={18} color="rgba(255,255,255,0.4)" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <TextInput
                  value={commandText}
                  onChangeText={setCommandText}
                  placeholder='Say something... (e.g. "10 at 80")'
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={{
                    color: "#fff",
                    fontSize: 15,
                    paddingVertical: 14,
                  }}
                  onSubmitEditing={() => sendCommand(commandText)}
                  returnKeyType="send"
                  editable={!processing}
                />
              </View>
              <TouchableOpacity
                onPress={() => sendCommand(commandText)}
                disabled={processing || !commandText.trim()}
                style={{ opacity: processing || !commandText.trim() ? 0.3 : 1 }}
              >
                <Ionicons name="send" size={22} color="#E8614D" />
              </TouchableOpacity>
            </View>

            {/* Recent command history */}
            {history.length > 0 && (
              <View style={{ marginTop: 12, maxHeight: 100 }}>
                {history.slice(0, 3).map((h) => (
                  <View
                    key={h.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 6,
                      borderBottomWidth: 1,
                      borderBottomColor: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, flex: 1 }}>
                      "{h.command}"
                    </Text>
                    <Text style={{ color: "rgba(232,97,77,0.6)", fontSize: 11 }}>{h.action}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

