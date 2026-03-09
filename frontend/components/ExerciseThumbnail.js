"use client";

// Inline SVG muscle group icons — no external requests, instant rendering
// Supports two modes: icon (small square) and banner (wide card header)

const MUSCLE_DATA = {
  chest: {
    bg: "#991b1b", bgGrad: "#7f1d1d", accent: "#fca5a5", label: "Chest",
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#991b1b" />
        <path d="M8 14 Q12 10 18 12 Q24 10 28 14 L26 22 Q22 24 18 22 Q14 24 10 22 Z" fill="#fca5a5" opacity="0.85" />
        <line x1="18" y1="12" x2="18" y2="22" stroke="#991b1b" strokeWidth="1" />
      </svg>
    ),
  },
  back: {
    bg: "#1e3a5f", bgGrad: "#172554", accent: "#93c5fd", label: "Back",
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#1e3a5f" />
        <path d="M14 10 L22 10 L24 14 L26 26 L22 28 L18 24 L14 28 L10 26 L12 14 Z" fill="#93c5fd" opacity="0.85" />
        <line x1="18" y1="10" x2="18" y2="24" stroke="#1e3a5f" strokeWidth="1.2" />
      </svg>
    ),
  },
  shoulders: {
    bg: "#713f12", bgGrad: "#5c3310", accent: "#fcd34d", label: "Shoulders",
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#713f12" />
        <circle cx="10" cy="16" r="5" fill="#fcd34d" opacity="0.85" />
        <circle cx="26" cy="16" r="5" fill="#fcd34d" opacity="0.85" />
        <rect x="13" y="14" width="10" height="12" rx="2" fill="#fcd34d" opacity="0.5" />
      </svg>
    ),
  },
  legs: {
    bg: "#14532d", bgGrad: "#0f3d1f", accent: "#86efac", label: "Legs",
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#14532d" />
        <path d="M12 8 L16 8 L17 18 L18 28 L14 28 L11 18 Z" fill="#86efac" opacity="0.85" />
        <path d="M24 8 L20 8 L19 18 L18 28 L22 28 L25 18 Z" fill="#86efac" opacity="0.85" />
      </svg>
    ),
  },
  arms: {
    bg: "#581c87", bgGrad: "#4a1772", accent: "#d8b4fe", label: "Arms",
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#581c87" />
        <path d="M10 26 L12 14 Q14 8 18 12 Q20 16 18 20 L16 26 Z" fill="#d8b4fe" opacity="0.85" />
        <path d="M22 26 L24 18 Q25 14 27 18 L26 26 Z" fill="#d8b4fe" opacity="0.6" />
      </svg>
    ),
  },
  core: {
    bg: "#831843", bgGrad: "#6b1538", accent: "#f9a8d4", label: "Core",
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#831843" />
        <rect x="12" y="9" width="5" height="5" rx="1.5" fill="#f9a8d4" opacity="0.85" />
        <rect x="19" y="9" width="5" height="5" rx="1.5" fill="#f9a8d4" opacity="0.85" />
        <rect x="12" y="16" width="5" height="5" rx="1.5" fill="#f9a8d4" opacity="0.85" />
        <rect x="19" y="16" width="5" height="5" rx="1.5" fill="#f9a8d4" opacity="0.85" />
        <rect x="12" y="23" width="5" height="5" rx="1.5" fill="#f9a8d4" opacity="0.7" />
        <rect x="19" y="23" width="5" height="5" rx="1.5" fill="#f9a8d4" opacity="0.7" />
      </svg>
    ),
  },
  cardio: {
    bg: "#7c2d12", bgGrad: "#651f0a", accent: "#fdba74", label: "Cardio",
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#7c2d12" />
        <path d="M18 27 Q8 20 8 14 Q8 9 13 9 Q16 9 18 12 Q20 9 23 9 Q28 9 28 14 Q28 20 18 27Z" fill="#fdba74" opacity="0.85" />
      </svg>
    ),
  },
  "full body": {
    bg: "#312e81", bgGrad: "#272568", accent: "#a5b4fc", label: "Full Body",
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#312e81" />
        <circle cx="18" cy="10" r="4" fill="#a5b4fc" opacity="0.85" />
        <path d="M12 16 L24 16 L22 24 L20 24 L20 30 L16 30 L16 24 L14 24 Z" fill="#a5b4fc" opacity="0.85" />
        <line x1="10" y1="17" x2="14" y2="22" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
        <line x1="26" y1="17" x2="22" y2="22" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      </svg>
    ),
  },
};

function getData(muscleGroup) {
  return MUSCLE_DATA[(muscleGroup || "").toLowerCase()] || MUSCLE_DATA["full body"];
}

export function getExerciseColor(muscleGroup) {
  const data = getData(muscleGroup);
  return { bg: data.bg, accent: data.accent };
}

// Banner: wide gradient header with large centered icon for exercise cards
export function ExerciseBanner({ muscleGroup }) {
  const data = getData(muscleGroup);
  return (
    <div
      style={{
        width: "100%",
        height: 80,
        background: `linear-gradient(135deg, ${data.bg} 0%, ${data.bgGrad} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Large centered icon */}
      <div style={{ opacity: 0.6, lineHeight: 0 }}>
        {data.iconSvg(52)}
      </div>
      {/* Muscle group label */}
      <span
        style={{
          position: "absolute",
          bottom: 6,
          right: 10,
          fontSize: 10,
          fontWeight: 600,
          color: data.accent,
          opacity: 0.5,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {data.label}
      </span>
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: data.accent,
          opacity: 0.06,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -15,
          left: -15,
          width: 45,
          height: 45,
          borderRadius: "50%",
          background: data.accent,
          opacity: 0.04,
        }}
      />
    </div>
  );
}

// Default: small square icon
export default function ExerciseThumbnail({ muscleGroup, size = 36 }) {
  const data = getData(muscleGroup);
  return (
    <div style={{ width: size, height: size, minWidth: size, minHeight: size, flexShrink: 0, lineHeight: 0 }}>
      {data.iconSvg(size)}
    </div>
  );
}
