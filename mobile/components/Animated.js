import { useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Layout,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Fade-in card with stagger delay based on index
export function AnimatedCard({ children, index = 0, className = "", onPress, delay = 50 }) {
  const Wrapper = onPress ? AnimatedTouchable : Animated.View;

  return (
    <Wrapper
      entering={FadeInDown.delay(index * delay).duration(300).springify()}
      layout={Layout.springify()}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className={`bg-dark-card rounded-2xl p-4 mb-3 ${className}`}
    >
      {children}
    </Wrapper>
  );
}

// Scale-on-press button
export function AnimatedPressable({ children, onPress, className = "", style }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
      activeOpacity={0.9}
      className={className}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedTouchable>
  );
}

// Number counter animation
export function AnimatedNumber({ value, className = "" }) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration: 800 });
  }, [value]);

  // Since Animated.Text doesn't support animated text content directly,
  // we use opacity animation on the container
  return (
    <Animated.Text
      entering={FadeIn.duration(400)}
      className={className}
    >
      {value}
    </Animated.Text>
  );
}

// Staggered list container
export function StaggeredList({ children, className = "" }) {
  return (
    <Animated.View className={className} layout={Layout.springify()}>
      {children}
    </Animated.View>
  );
}

// Re-export commonly used animations for convenience
export {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Layout,
};
export { default as ReAnimated } from "react-native-reanimated";
