"use client";
import { useState } from "react";

const MUSCLE_CONFIG = {
  chest: { letter: "C", color: "#fca5a5", bg: "#991b1b" },
  back: { letter: "B", color: "#93c5fd", bg: "#1e3a5f" },
  shoulders: { letter: "S", color: "#fcd34d", bg: "#713f12" },
  legs: { letter: "L", color: "#86efac", bg: "#14532d" },
  arms: { letter: "A", color: "#d8b4fe", bg: "#581c87" },
  core: { letter: "X", color: "#f9a8d4", bg: "#831843" },
  cardio: { letter: "H", color: "#fdba74", bg: "#7c2d12" },
  "full body": { letter: "F", color: "#a5b4fc", bg: "#312e81" },
};

function LetterBadge({ muscleGroup, size }) {
  const config = MUSCLE_CONFIG[muscleGroup] || MUSCLE_CONFIG["full body"];
  const fontSize = Math.max(12, Math.round(size * 0.45));
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        backgroundColor: config.bg,
        color: config.color,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: fontSize,
        fontWeight: 700,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {config.letter}
    </div>
  );
}

export default function ExerciseThumbnail({ muscleGroup, photoUrl, size = 36 }) {
  const [imgError, setImgError] = useState(false);

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt=""
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          objectFit: "cover",
          borderRadius: 8,
          flexShrink: 0,
          backgroundColor: "#1f2937",
        }}
      />
    );
  }

  return <LetterBadge muscleGroup={muscleGroup} size={size} />;
}
