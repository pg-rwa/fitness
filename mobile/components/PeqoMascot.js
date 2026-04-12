import { View, Text, TouchableOpacity } from "react-native";
import { useEffect, useCallback } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";

/**
 * Peqo Mascot — an expressive animated fitness companion.
 *
 * Props:
 *   mood      — "idle" | "happy" | "celebrating" | "concerned" | "sleeping" | "motivated" | "thinking"
 *   size      — base size in px (default 120)
 *   message   — optional speech bubble text
 *   onPress   — optional tap handler
 *   level     — fitness level 1-10 (affects body width / "buffer" look)
 */
export default function PeqoMascot({ mood = "idle", size = 120, message, onPress, level = 1 }) {
  // ── Animated values ──────────────────────────────────────────
  const bodyY = useSharedValue(0);
  const bodyScale = useSharedValue(1);
  const bodyRotation = useSharedValue(0);
  const leftEyeScaleY = useSharedValue(1);
  const rightEyeScaleY = useSharedValue(1);
  const pupilX = useSharedValue(0);
  const mouthWidth = useSharedValue(size * 0.2);
  const mouthHeight = useSharedValue(size * 0.08);
  const mouthBorderRadius = useSharedValue(size * 0.04);
  const mouthY = useSharedValue(0);
  const bubbleOpacity = useSharedValue(message ? 1 : 0);
  const shine = useSharedValue(0.25);

  // Body gets slightly wider as fitness level increases (Peqo gets buffer)
  const bufferScale = 1 + Math.min(level, 10) * 0.02;

  // ── Blink cycle ──────────────────────────────────────────────
  const startBlink = useCallback(() => {
    const blinkAnim = withRepeat(
      withSequence(
        withDelay(
          2500 + Math.random() * 2000,
          withTiming(0.1, { duration: 80 })
        ),
        withTiming(1, { duration: 80 })
      ),
      -1
    );
    leftEyeScaleY.value = blinkAnim;
    rightEyeScaleY.value = blinkAnim;
  }, []);

  // ── Mood animations ──────────────────────────────────────────
  useEffect(() => {
    // Cancel previous
    cancelAnimation(bodyY);
    cancelAnimation(bodyScale);
    cancelAnimation(bodyRotation);

    switch (mood) {
      case "idle":
        bodyY.value = withRepeat(
          withSequence(
            withTiming(-6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
          ),
          -1
        );
        bodyScale.value = withTiming(1, { duration: 300 });
        bodyRotation.value = withTiming(0, { duration: 300 });
        mouthWidth.value = withTiming(size * 0.18, { duration: 300 });
        mouthHeight.value = withTiming(size * 0.06, { duration: 300 });
        mouthBorderRadius.value = withTiming(size * 0.06, { duration: 300 });
        mouthY.value = withTiming(0, { duration: 300 });
        pupilX.value = withTiming(0, { duration: 300 });
        startBlink();
        break;

      case "happy":
        bodyY.value = withRepeat(
          withSequence(
            withTiming(-8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
          ),
          -1
        );
        bodyScale.value = withSpring(1.05);
        bodyRotation.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 400 }),
            withTiming(2, { duration: 400 })
          ),
          -1
        );
        mouthWidth.value = withTiming(size * 0.25, { duration: 300 });
        mouthHeight.value = withTiming(size * 0.1, { duration: 300 });
        mouthBorderRadius.value = withTiming(size * 0.1, { duration: 300 });
        mouthY.value = withTiming(0, { duration: 300 });
        // Happy squint
        leftEyeScaleY.value = withTiming(0.6, { duration: 200 });
        rightEyeScaleY.value = withTiming(0.6, { duration: 200 });
        break;

      case "celebrating":
        bodyY.value = withRepeat(
          withSequence(
            withSpring(-16, { damping: 4, stiffness: 200 }),
            withSpring(0, { damping: 4, stiffness: 200 })
          ),
          -1
        );
        bodyScale.value = withRepeat(
          withSequence(
            withTiming(1.15, { duration: 200 }),
            withTiming(1.0, { duration: 200 })
          ),
          -1
        );
        bodyRotation.value = withRepeat(
          withSequence(
            withTiming(-5, { duration: 150 }),
            withTiming(5, { duration: 150 })
          ),
          -1
        );
        mouthWidth.value = withTiming(size * 0.22, { duration: 200 });
        mouthHeight.value = withTiming(size * 0.14, { duration: 200 });
        mouthBorderRadius.value = withTiming(size * 0.11, { duration: 200 });
        mouthY.value = withTiming(0, { duration: 200 });
        leftEyeScaleY.value = withTiming(1.2, { duration: 200 });
        rightEyeScaleY.value = withTiming(1.2, { duration: 200 });
        break;

      case "concerned":
        bodyY.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1
        );
        bodyScale.value = withTiming(0.95, { duration: 400 });
        bodyRotation.value = withTiming(-3, { duration: 400 });
        // Flat/worried mouth
        mouthWidth.value = withTiming(size * 0.15, { duration: 300 });
        mouthHeight.value = withTiming(size * 0.03, { duration: 300 });
        mouthBorderRadius.value = withTiming(size * 0.02, { duration: 300 });
        mouthY.value = withTiming(size * 0.03, { duration: 300 });
        // Worried eyes — slightly uneven
        leftEyeScaleY.value = withTiming(0.85, { duration: 300 });
        rightEyeScaleY.value = withTiming(1.0, { duration: 300 });
        pupilX.value = withTiming(-1, { duration: 300 });
        break;

      case "sleeping":
        bodyY.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
          ),
          -1
        );
        bodyScale.value = withTiming(0.95, { duration: 600 });
        bodyRotation.value = withTiming(5, { duration: 600 });
        // Closed eyes
        leftEyeScaleY.value = withTiming(0.05, { duration: 400 });
        rightEyeScaleY.value = withTiming(0.05, { duration: 400 });
        // No mouth
        mouthWidth.value = withTiming(0, { duration: 400 });
        mouthHeight.value = withTiming(0, { duration: 400 });
        break;

      case "motivated":
        bodyY.value = withRepeat(
          withSequence(
            withSpring(-10, { damping: 6, stiffness: 180 }),
            withSpring(0, { damping: 6, stiffness: 180 })
          ),
          -1
        );
        bodyScale.value = withRepeat(
          withSequence(
            withTiming(1.08, { duration: 400 }),
            withTiming(1.0, { duration: 400 })
          ),
          -1
        );
        bodyRotation.value = withTiming(0, { duration: 200 });
        mouthWidth.value = withTiming(size * 0.28, { duration: 250 });
        mouthHeight.value = withTiming(size * 0.12, { duration: 250 });
        mouthBorderRadius.value = withTiming(size * 0.12, { duration: 250 });
        mouthY.value = withTiming(0, { duration: 250 });
        leftEyeScaleY.value = withTiming(0.7, { duration: 200 });
        rightEyeScaleY.value = withTiming(0.7, { duration: 200 });
        pupilX.value = withTiming(1, { duration: 200 });
        break;

      case "thinking":
        bodyY.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
          ),
          -1
        );
        bodyScale.value = withTiming(1, { duration: 300 });
        bodyRotation.value = withTiming(4, { duration: 500 });
        // Asymmetric eyes
        leftEyeScaleY.value = withTiming(0.5, { duration: 300 });
        rightEyeScaleY.value = withTiming(1.1, { duration: 300 });
        pupilX.value = withRepeat(
          withSequence(
            withTiming(2, { duration: 1000 }),
            withTiming(-1, { duration: 1000 })
          ),
          -1
        );
        // Small "hmm" mouth
        mouthWidth.value = withTiming(size * 0.1, { duration: 300 });
        mouthHeight.value = withTiming(size * 0.06, { duration: 300 });
        mouthBorderRadius.value = withTiming(size * 0.06, { duration: 300 });
        mouthY.value = withTiming(size * 0.02, { duration: 300 });
        break;
    }

    // Bubble
    bubbleOpacity.value = withTiming(message ? 1 : 0, { duration: 300 });
  }, [mood, message, size]);

  // ── Animated styles ──────────────────────────────────────────
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bodyY.value },
      { scale: bodyScale.value },
      { rotate: `${bodyRotation.value}deg` },
    ],
  }));

  const leftEyeStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: leftEyeScaleY.value },
      { translateX: pupilX.value },
    ],
  }));

  const rightEyeStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: rightEyeScaleY.value },
      { translateX: pupilX.value },
    ],
  }));

  const mouthStyle = useAnimatedStyle(() => ({
    width: mouthWidth.value,
    height: mouthHeight.value,
    borderBottomLeftRadius: mouthBorderRadius.value,
    borderBottomRightRadius: mouthBorderRadius.value,
    borderTopLeftRadius: mouthBorderRadius.value * 0.2,
    borderTopRightRadius: mouthBorderRadius.value * 0.2,
    transform: [{ translateY: mouthY.value }],
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
  }));

  // ── Dimensions ───────────────────────────────────────────────
  const eyeSize = size * 0.16;
  const pupilSize = eyeSize * 0.55;
  const bodyRadius = size * 0.35;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper onPress={onPress} activeOpacity={onPress ? 0.8 : 1} style={{ alignItems: "center" }}>
      {/* Speech bubble */}
      {message && (
        <Animated.View
          style={[
            bubbleStyle,
            {
              backgroundColor: "rgba(30, 30, 46, 0.95)",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 8,
              marginBottom: 8,
              maxWidth: size * 2,
              borderWidth: 1,
              borderColor: "rgba(232, 97, 77, 0.3)",
            },
          ]}
        >
          <Text style={{ color: "#fff", fontSize: size * 0.1, textAlign: "center", lineHeight: size * 0.14 }}>
            {message}
          </Text>
          {/* Bubble tail */}
          <View
            style={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              marginLeft: -6,
              width: 12,
              height: 12,
              backgroundColor: "rgba(30, 30, 46, 0.95)",
              borderRightWidth: 1,
              borderBottomWidth: 1,
              borderColor: "rgba(232, 97, 77, 0.3)",
              transform: [{ rotate: "45deg" }],
            }}
          />
        </Animated.View>
      )}

      {/* Body */}
      <Animated.View
        style={[
          bodyStyle,
          {
            width: size * bufferScale,
            height: size,
            borderRadius: bodyRadius,
            backgroundColor: "#E8614D",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#E8614D",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          },
        ]}
      >
        {/* Body highlight / shine */}
        <View
          style={{
            position: "absolute",
            top: size * 0.08,
            left: size * 0.12,
            width: size * 0.22,
            height: size * 0.14,
            borderRadius: size * 0.1,
            backgroundColor: "rgba(255, 255, 255, 0.25)",
          }}
        />

        {/* Secondary shine */}
        <View
          style={{
            position: "absolute",
            top: size * 0.06,
            left: size * 0.38,
            width: size * 0.08,
            height: size * 0.06,
            borderRadius: size * 0.04,
            backgroundColor: "rgba(255, 255, 255, 0.15)",
          }}
        />

        {/* Eyes container */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop: -size * 0.08,
            gap: size * 0.14,
          }}
        >
          {/* Left eye */}
          <Animated.View style={[leftEyeStyle]}>
            <View
              style={{
                width: eyeSize,
                height: eyeSize,
                borderRadius: eyeSize / 2,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: pupilSize,
                  height: pupilSize,
                  borderRadius: pupilSize / 2,
                  backgroundColor: "#1E1E2E",
                }}
              />
              {/* Eye sparkle */}
              <View
                style={{
                  position: "absolute",
                  top: eyeSize * 0.15,
                  right: eyeSize * 0.18,
                  width: eyeSize * 0.22,
                  height: eyeSize * 0.22,
                  borderRadius: eyeSize * 0.11,
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                }}
              />
            </View>
          </Animated.View>

          {/* Right eye */}
          <Animated.View style={[rightEyeStyle]}>
            <View
              style={{
                width: eyeSize,
                height: eyeSize,
                borderRadius: eyeSize / 2,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: pupilSize,
                  height: pupilSize,
                  borderRadius: pupilSize / 2,
                  backgroundColor: "#1E1E2E",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  top: eyeSize * 0.15,
                  right: eyeSize * 0.18,
                  width: eyeSize * 0.22,
                  height: eyeSize * 0.22,
                  borderRadius: eyeSize * 0.11,
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                }}
              />
            </View>
          </Animated.View>
        </View>

        {/* Mouth */}
        <Animated.View
          style={[
            mouthStyle,
            {
              marginTop: size * 0.06,
              backgroundColor: "#C0392B",
              overflow: "hidden",
            },
          ]}
        >
          {/* Tongue for celebrating/motivated */}
          {(mood === "celebrating" || mood === "motivated") && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: "30%",
                width: "40%",
                height: "60%",
                borderTopLeftRadius: 100,
                borderTopRightRadius: 100,
                backgroundColor: "#E8614D",
              }}
            />
          )}
        </Animated.View>

        {/* Sleeping Zzz */}
        {mood === "sleeping" && (
          <View style={{ position: "absolute", top: -size * 0.05, right: -size * 0.05 }}>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: size * 0.12, fontWeight: "bold" }}>z</Text>
            <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: size * 0.09, fontWeight: "bold", marginLeft: 8, marginTop: -4 }}>z</Text>
            <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: size * 0.07, fontWeight: "bold", marginLeft: 14, marginTop: -3 }}>z</Text>
          </View>
        )}

        {/* Thinking dots */}
        {mood === "thinking" && (
          <View style={{ position: "absolute", top: size * 0.15, right: -size * 0.2, flexDirection: "row", gap: 3 }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" }} />
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.5)" }} />
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.6)" }} />
          </View>
        )}

        {/* Celebration sparkles */}
        {mood === "celebrating" && (
          <>
            <View style={{ position: "absolute", top: -4, left: size * 0.1 }}>
              <Text style={{ fontSize: size * 0.1 }}>*</Text>
            </View>
            <View style={{ position: "absolute", top: -2, right: size * 0.08 }}>
              <Text style={{ fontSize: size * 0.08, color: "#FBBF24" }}>*</Text>
            </View>
            <View style={{ position: "absolute", bottom: size * 0.05, right: -4 }}>
              <Text style={{ fontSize: size * 0.07, color: "#FBBF24" }}>*</Text>
            </View>
          </>
        )}
      </Animated.View>

      {/* Name label */}
      <Text
        style={{
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: size * 0.09,
          fontWeight: "600",
          marginTop: 6,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        PEQO
      </Text>
    </Wrapper>
  );
}
