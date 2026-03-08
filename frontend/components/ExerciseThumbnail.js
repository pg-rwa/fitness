"use client";

const MUSCLE_CONFIG = {
  chest: { color: "#ef4444", bg: "#ef44441a", icon: "💪" },
  back: { color: "#3b82f6", bg: "#3b82f61a", icon: "🔙" },
  shoulders: { color: "#f59e0b", bg: "#f59e0b1a", icon: "🏋" },
  legs: { color: "#22c55e", bg: "#22c55e1a", icon: "🦵" },
  arms: { color: "#a855f7", bg: "#a855f71a", icon: "💪" },
  core: { color: "#ec4899", bg: "#ec48991a", icon: "🎯" },
  cardio: { color: "#f97316", bg: "#f973161a", icon: "❤" },
  "full body": { color: "#6366f1", bg: "#6366f11a", icon: "⚡" },
};

function MuscleIcon({ muscleGroup, size }) {
  const s = size * 0.55;
  switch (muscleGroup) {
    case "chest":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 6c0-2 2-4 6-4s6 2 6 4c0 4-3 6-6 8-3-2-6-4-6-8z" />
          <line x1="12" y1="2" x2="12" y2="14" />
        </svg>
      );
    case "back":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" />
          <path d="M8 4c-2 2-3 6-3 10" />
          <path d="M16 4c2 2 3 6 3 10" />
          <path d="M7 12h10" />
          <path d="M8 18h8" />
        </svg>
      );
    case "shoulders":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="14" r="4" />
          <path d="M4 10c2-4 5-6 8-6s6 2 8 6" />
          <path d="M8 14H4" />
          <path d="M16 14h4" />
        </svg>
      );
    case "legs":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v6c0 2-2 4-2 8s1 6 1 6" />
          <path d="M16 2v6c0 2 2 4 2 8s-1 6-1 6" />
          <path d="M9 10h6" />
        </svg>
      );
    case "arms":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18L6 6c0-1 1-2 2-2h0" />
          <path d="M8 4c2 0 4 2 4 5" />
          <circle cx="12" cy="12" r="3" />
          <path d="M15 12c0 3-1 6-1 6" />
        </svg>
      );
    case "core":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="4" width="12" height="16" rx="2" />
          <line x1="6" y1="8" x2="18" y2="8" />
          <line x1="6" y1="12" x2="18" y2="12" />
          <line x1="6" y1="16" x2="18" y2="16" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      );
    case "cardio":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
  }
}

export default function ExerciseThumbnail({ muscleGroup, size = 36 }) {
  const config = MUSCLE_CONFIG[muscleGroup] || MUSCLE_CONFIG["full body"];

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-lg"
      style={{
        width: size,
        height: size,
        minWidth: size,
        backgroundColor: config.bg,
        color: config.color,
        border: `1.5px solid ${config.color}33`,
      }}
    >
      <MuscleIcon muscleGroup={muscleGroup} size={size} />
    </div>
  );
}
