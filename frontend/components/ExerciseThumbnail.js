"use client";

const MUSCLE_COLORS = {
  chest: "#ef4444",
  back: "#3b82f6",
  shoulders: "#f59e0b",
  legs: "#22c55e",
  arms: "#a855f7",
  core: "#ec4899",
  "full body": "#6366f1",
};

const MUSCLE_HIGHLIGHTS = {
  chest: (c) => `<ellipse fill="${c}" opacity="0.7" cx="88" cy="90" rx="18" ry="16"/><ellipse fill="${c}" opacity="0.7" cx="112" cy="90" rx="18" ry="16"/>`,
  back: (c) => `<rect fill="${c}" opacity="0.7" x="75" y="75" width="50" height="55" rx="8"/>`,
  shoulders: (c) => `<ellipse fill="${c}" opacity="0.7" cx="60" cy="68" rx="14" ry="10"/><ellipse fill="${c}" opacity="0.7" cx="140" cy="68" rx="14" ry="10"/>`,
  legs: (c) => `<path fill="${c}" opacity="0.7" d="M70,180 L65,250 L82,255 L85,180 Z"/><path fill="${c}" opacity="0.7" d="M130,180 L135,250 L118,255 L115,180 Z"/>`,
  arms: (c) => `<path fill="${c}" opacity="0.7" d="M45,70 L32,130 L48,135 L55,80 Z"/><path fill="${c}" opacity="0.7" d="M155,70 L168,130 L152,135 L145,80 Z"/>`,
  core: (c) => `<rect fill="${c}" opacity="0.7" x="78" y="120" width="44" height="55" rx="6"/>`,
  "full body": (c) => `<path fill="${c}" opacity="0.6" d="M65,64 L135,64 L130,180 L70,180 Z"/><path fill="${c}" opacity="0.4" d="M70,180 L65,250 L82,255 L85,180 Z"/><path fill="${c}" opacity="0.4" d="M130,180 L135,250 L118,255 L115,180 Z"/><path fill="${c}" opacity="0.4" d="M45,70 L32,130 L48,135 L55,80 Z"/><path fill="${c}" opacity="0.4" d="M155,70 L168,130 L152,135 L145,80 Z"/>`,
};

function buildSvg(muscleGroup) {
  const color = MUSCLE_COLORS[muscleGroup] || MUSCLE_COLORS["full body"];
  const highlights = (MUSCLE_HIGHLIGHTS[muscleGroup] || MUSCLE_HIGHLIGHTS["full body"])(color);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 320" width="200" height="320">
  <ellipse fill="#374151" cx="100" cy="30" rx="20" ry="24"/>
  <rect fill="#374151" x="92" y="52" width="16" height="12"/>
  <path fill="#374151" d="M65,64 L135,64 L130,180 L70,180 Z"/>
  <path fill="#374151" d="M65,64 L45,70 L32,130 L28,180 L40,182 L48,135 L55,80"/>
  <path fill="#374151" d="M135,64 L155,70 L168,130 L172,180 L160,182 L152,135 L145,80"/>
  <path fill="#374151" d="M70,180 L65,250 L60,310 L80,312 L82,255 L85,180"/>
  <path fill="#374151" d="M130,180 L135,250 L140,310 L120,312 L118,255 L115,180"/>
  ${highlights}
</svg>`;
}

export default function ExerciseThumbnail({ muscleGroup, size = 32 }) {
  const svg = buildSvg(muscleGroup);
  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  return (
    <img
      src={dataUri}
      alt={muscleGroup}
      width={size}
      height={Math.round(size * 1.6)}
      className="flex-shrink-0 rounded"
      style={{ width: size, height: Math.round(size * 1.6) }}
    />
  );
}
