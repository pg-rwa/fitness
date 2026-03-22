import { View, Text } from "react-native";

export const MUSCLE_COLORS = {
  chest: "#991b1b",
  back: "#1e3a5f",
  shoulders: "#713f12",
  legs: "#14532d",
  arms: "#581c87",
  biceps: "#581c87",
  triceps: "#581c87",
  forearms: "#581c87",
  core: "#831843",
  cardio: "#7c2d12",
  "full body": "#312e81",
  full_body: "#312e81",
  quadriceps: "#14532d",
  hamstrings: "#14532d",
  glutes: "#14532d",
  calves: "#14532d",
};

export function getMuscleColor(muscleGroup) {
  return MUSCLE_COLORS[(muscleGroup || "").toLowerCase()] || "#312e81";
}

/**
 * Colored muscle-group thumbnail matching the web app's ExerciseThumbnail.
 * @param {object} props
 * @param {string} props.muscleGroup - e.g. "chest", "back", "legs"
 * @param {number} [props.size=40] - width & height
 * @param {number} [props.borderRadius=10]
 */
export default function ExerciseThumbnail({ muscleGroup, size = 40, borderRadius = 10 }) {
  const bg = getMuscleColor(muscleGroup);
  const label = (muscleGroup || "exercise").replace("_", " ");

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "rgba(255,255,255,0.65)",
          fontSize: size < 36 ? 6 : 8,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.3,
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {label.length > 7 ? label.slice(0, 6) : label}
      </Text>
    </View>
  );
}
