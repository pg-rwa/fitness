"use client";

// Inline SVG muscle group icons — no external requests, instant rendering
// Supports two modes: icon (small square) and banner (wide card header)

const MUSCLE_DATA = {
  chest: {
    bg: "#991b1b",
    bgGrad: "#7f1d1d",
    accent: "#fca5a5",
    label: "Chest",
    // Detailed pec illustration for banner
    bannerSvg: () => (
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <defs>
          <linearGradient id="chest-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
        </defs>
        <rect width="120" height="60" fill="url(#chest-bg)" />
        {/* Torso outline */}
        <path d="M40 12 Q48 8 60 10 Q72 8 80 12 L82 20 Q78 28 72 32 L68 44 Q64 48 60 46 Q56 48 52 44 L48 32 Q42 28 38 20 Z" fill="#fca5a5" opacity="0.2" />
        {/* Left pec */}
        <path d="M42 16 Q48 12 58 15 L57 18 Q54 26 48 28 L44 22 Z" fill="#fca5a5" opacity="0.7" />
        {/* Right pec */}
        <path d="M78 16 Q72 12 62 15 L63 18 Q66 26 72 28 L76 22 Z" fill="#fca5a5" opacity="0.7" />
        {/* Center line */}
        <line x1="60" y1="12" x2="60" y2="34" stroke="#fca5a5" strokeWidth="0.8" opacity="0.5" />
        {/* Dumbbell */}
        <rect x="30" y="38" width="4" height="12" rx="1" fill="#fca5a5" opacity="0.35" />
        <rect x="24" y="41" width="16" height="1.5" rx="0.5" fill="#fca5a5" opacity="0.25" />
        <rect x="86" y="38" width="4" height="12" rx="1" fill="#fca5a5" opacity="0.35" />
        <rect x="80" y="41" width="16" height="1.5" rx="0.5" fill="#fca5a5" opacity="0.25" />
      </svg>
    ),
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#991b1b" />
        <path d="M8 14 Q12 10 18 12 Q24 10 28 14 L26 22 Q22 24 18 22 Q14 24 10 22 Z" fill="#fca5a5" opacity="0.85" />
        <line x1="18" y1="12" x2="18" y2="22" stroke="#991b1b" strokeWidth="1" />
      </svg>
    ),
  },
  back: {
    bg: "#1e3a5f",
    bgGrad: "#172554",
    accent: "#93c5fd",
    label: "Back",
    bannerSvg: () => (
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <defs>
          <linearGradient id="back-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>
        </defs>
        <rect width="120" height="60" fill="url(#back-bg)" />
        {/* Back outline */}
        <path d="M46 8 L54 6 L60 7 L66 6 L74 8 L78 14 L80 24 L76 36 L72 42 L68 48 L60 44 L52 48 L48 42 L44 36 L40 24 L42 14 Z" fill="#93c5fd" opacity="0.15" />
        {/* Left lat */}
        <path d="M44 14 Q48 12 54 14 L52 24 Q50 32 46 34 L42 26 Z" fill="#93c5fd" opacity="0.55" />
        {/* Right lat */}
        <path d="M76 14 Q72 12 66 14 L68 24 Q70 32 74 34 L78 26 Z" fill="#93c5fd" opacity="0.55" />
        {/* Spine */}
        <line x1="60" y1="8" x2="60" y2="44" stroke="#93c5fd" strokeWidth="1" opacity="0.4" />
        {/* Traps */}
        <path d="M50 10 Q55 8 60 9 Q65 8 70 10 L68 16 Q64 14 60 15 Q56 14 52 16 Z" fill="#93c5fd" opacity="0.5" />
        {/* Pull-up bar */}
        <rect x="20" y="6" width="80" height="2" rx="1" fill="#93c5fd" opacity="0.15" />
      </svg>
    ),
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#1e3a5f" />
        <path d="M14 10 L22 10 L24 14 L26 26 L22 28 L18 24 L14 28 L10 26 L12 14 Z" fill="#93c5fd" opacity="0.85" />
        <line x1="18" y1="10" x2="18" y2="24" stroke="#1e3a5f" strokeWidth="1.2" />
      </svg>
    ),
  },
  shoulders: {
    bg: "#713f12",
    bgGrad: "#5c3310",
    accent: "#fcd34d",
    label: "Shoulders",
    bannerSvg: () => (
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <defs>
          <linearGradient id="shoulders-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#713f12" />
            <stop offset="100%" stopColor="#5c3310" />
          </linearGradient>
        </defs>
        <rect width="120" height="60" fill="url(#shoulders-bg)" />
        {/* Torso */}
        <rect x="50" y="18" width="20" height="30" rx="4" fill="#fcd34d" opacity="0.15" />
        {/* Left deltoid */}
        <ellipse cx="42" cy="22" rx="10" ry="9" fill="#fcd34d" opacity="0.55" />
        {/* Right deltoid */}
        <ellipse cx="78" cy="22" rx="10" ry="9" fill="#fcd34d" opacity="0.55" />
        {/* Neck */}
        <rect x="56" y="10" width="8" height="10" rx="3" fill="#fcd34d" opacity="0.2" />
        {/* Left arm */}
        <path d="M34 28 L36 42 L40 42 L42 30 Z" fill="#fcd34d" opacity="0.25" />
        {/* Right arm */}
        <path d="M86 28 L84 42 L80 42 L78 30 Z" fill="#fcd34d" opacity="0.25" />
        {/* Dumbbell in hand */}
        <rect x="28" y="40" width="3" height="10" rx="1" fill="#fcd34d" opacity="0.3" />
        <rect x="89" y="40" width="3" height="10" rx="1" fill="#fcd34d" opacity="0.3" />
      </svg>
    ),
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
    bg: "#14532d",
    bgGrad: "#0f3d1f",
    accent: "#86efac",
    label: "Legs",
    bannerSvg: () => (
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <defs>
          <linearGradient id="legs-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#14532d" />
            <stop offset="100%" stopColor="#0f3d1f" />
          </linearGradient>
        </defs>
        <rect width="120" height="60" fill="url(#legs-bg)" />
        {/* Left quad */}
        <path d="M44 4 L52 4 L54 20 L56 40 L58 54 L50 56 L46 54 L42 40 L40 20 Z" fill="#86efac" opacity="0.5" />
        {/* Right quad */}
        <path d="M76 4 L68 4 L66 20 L64 40 L62 54 L70 56 L74 54 L78 40 L80 20 Z" fill="#86efac" opacity="0.5" />
        {/* Left calf detail */}
        <path d="M44 32 Q46 28 50 30 L50 40 Q48 42 44 40 Z" fill="#86efac" opacity="0.3" />
        {/* Right calf detail */}
        <path d="M76 32 Q74 28 70 30 L70 40 Q72 42 76 40 Z" fill="#86efac" opacity="0.3" />
        {/* Hip line */}
        <path d="M42 4 Q60 0 78 4" fill="none" stroke="#86efac" strokeWidth="1" opacity="0.3" />
        {/* Barbell across shoulders */}
        <rect x="20" y="0" width="80" height="2" rx="1" fill="#86efac" opacity="0.2" />
        <rect x="18" y="-2" width="6" height="6" rx="1" fill="#86efac" opacity="0.15" />
        <rect x="96" y="-2" width="6" height="6" rx="1" fill="#86efac" opacity="0.15" />
      </svg>
    ),
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#14532d" />
        <path d="M12 8 L16 8 L17 18 L18 28 L14 28 L11 18 Z" fill="#86efac" opacity="0.85" />
        <path d="M24 8 L20 8 L19 18 L18 28 L22 28 L25 18 Z" fill="#86efac" opacity="0.85" />
      </svg>
    ),
  },
  arms: {
    bg: "#581c87",
    bgGrad: "#4a1772",
    accent: "#d8b4fe",
    label: "Arms",
    bannerSvg: () => (
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <defs>
          <linearGradient id="arms-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#581c87" />
            <stop offset="100%" stopColor="#4a1772" />
          </linearGradient>
        </defs>
        <rect width="120" height="60" fill="url(#arms-bg)" />
        {/* Left arm - bicep curl pose */}
        <path d="M32 46 L36 28 Q38 16 44 14 Q48 12 50 18 Q48 26 46 30 L42 46 Z" fill="#d8b4fe" opacity="0.55" />
        {/* Left bicep peak */}
        <ellipse cx="44" cy="18" rx="5" ry="4" fill="#d8b4fe" opacity="0.4" />
        {/* Right arm */}
        <path d="M88 46 L84 28 Q82 16 76 14 Q72 12 70 18 Q72 26 74 30 L78 46 Z" fill="#d8b4fe" opacity="0.55" />
        {/* Right bicep peak */}
        <ellipse cx="76" cy="18" rx="5" ry="4" fill="#d8b4fe" opacity="0.4" />
        {/* Dumbbells */}
        <rect x="28" y="44" width="3" height="10" rx="1" fill="#d8b4fe" opacity="0.35" />
        <rect x="22" y="47" width="16" height="1.5" rx="0.5" fill="#d8b4fe" opacity="0.2" />
        <rect x="89" y="44" width="3" height="10" rx="1" fill="#d8b4fe" opacity="0.35" />
        <rect x="83" y="47" width="16" height="1.5" rx="0.5" fill="#d8b4fe" opacity="0.2" />
        {/* Flexing lines */}
        <path d="M50 12 L52 8" stroke="#d8b4fe" strokeWidth="0.8" opacity="0.3" />
        <path d="M70 12 L68 8" stroke="#d8b4fe" strokeWidth="0.8" opacity="0.3" />
      </svg>
    ),
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#581c87" />
        <path d="M10 26 L12 14 Q14 8 18 12 Q20 16 18 20 L16 26 Z" fill="#d8b4fe" opacity="0.85" />
        <path d="M22 26 L24 18 Q25 14 27 18 L26 26 Z" fill="#d8b4fe" opacity="0.6" />
      </svg>
    ),
  },
  core: {
    bg: "#831843",
    bgGrad: "#6b1538",
    accent: "#f9a8d4",
    label: "Core",
    bannerSvg: () => (
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <defs>
          <linearGradient id="core-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#831843" />
            <stop offset="100%" stopColor="#6b1538" />
          </linearGradient>
        </defs>
        <rect width="120" height="60" fill="url(#core-bg)" />
        {/* Torso outline */}
        <path d="M46 4 Q52 2 60 3 Q68 2 74 4 L76 14 L78 34 Q74 52 60 54 Q46 52 42 34 L44 14 Z" fill="#f9a8d4" opacity="0.1" />
        {/* Abs - 6 pack */}
        <rect x="50" y="8" width="8" height="7" rx="2.5" fill="#f9a8d4" opacity="0.55" />
        <rect x="62" y="8" width="8" height="7" rx="2.5" fill="#f9a8d4" opacity="0.55" />
        <rect x="50" y="18" width="8" height="7" rx="2.5" fill="#f9a8d4" opacity="0.5" />
        <rect x="62" y="18" width="8" height="7" rx="2.5" fill="#f9a8d4" opacity="0.5" />
        <rect x="50" y="28" width="8" height="7" rx="2.5" fill="#f9a8d4" opacity="0.4" />
        <rect x="62" y="28" width="8" height="7" rx="2.5" fill="#f9a8d4" opacity="0.4" />
        {/* Center line */}
        <line x1="60" y1="6" x2="60" y2="40" stroke="#f9a8d4" strokeWidth="0.8" opacity="0.35" />
        {/* Obliques */}
        <path d="M46 12 L50 10 L50 36 L46 38 Z" fill="#f9a8d4" opacity="0.2" />
        <path d="M74 12 L70 10 L70 36 L74 38 Z" fill="#f9a8d4" opacity="0.2" />
      </svg>
    ),
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
    bg: "#7c2d12",
    bgGrad: "#651f0a",
    accent: "#fdba74",
    label: "Cardio",
    bannerSvg: () => (
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <defs>
          <linearGradient id="cardio-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c2d12" />
            <stop offset="100%" stopColor="#651f0a" />
          </linearGradient>
        </defs>
        <rect width="120" height="60" fill="url(#cardio-bg)" />
        {/* Heart */}
        <path d="M60 48 Q36 34 36 22 Q36 12 46 12 Q52 12 60 20 Q68 12 74 12 Q84 12 84 22 Q84 34 60 48Z" fill="#fdba74" opacity="0.5" />
        {/* Heartbeat line */}
        <polyline points="20,32 38,32 42,22 46,40 50,28 54,32 66,32 70,22 74,40 78,28 82,32 100,32" fill="none" stroke="#fdba74" strokeWidth="1.5" opacity="0.4" />
        {/* Running figure */}
        <circle cx="60" cy="14" r="3" fill="#fdba74" opacity="0.3" />
      </svg>
    ),
    iconSvg: (s) => (
      <svg viewBox="0 0 36 36" width={s} height={s}>
        <rect width="36" height="36" rx="8" fill="#7c2d12" />
        <path d="M18 27 Q8 20 8 14 Q8 9 13 9 Q16 9 18 12 Q20 9 23 9 Q28 9 28 14 Q28 20 18 27Z" fill="#fdba74" opacity="0.85" />
      </svg>
    ),
  },
  "full body": {
    bg: "#312e81",
    bgGrad: "#272568",
    accent: "#a5b4fc",
    label: "Full Body",
    bannerSvg: () => (
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <defs>
          <linearGradient id="fullbody-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#272568" />
          </linearGradient>
        </defs>
        <rect width="120" height="60" fill="url(#fullbody-bg)" />
        {/* Person */}
        <circle cx="60" cy="10" r="5" fill="#a5b4fc" opacity="0.5" />
        <path d="M50 18 L70 18 L68 34 L66 34 L66 52 L62 52 L60 38 L58 52 L54 52 L54 34 L52 34 Z" fill="#a5b4fc" opacity="0.45" />
        {/* Left arm with dumbbell */}
        <line x1="50" y1="20" x2="38" y2="30" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
        <rect x="34" y="28" width="3" height="8" rx="1" fill="#a5b4fc" opacity="0.35" />
        {/* Right arm with dumbbell */}
        <line x1="70" y1="20" x2="82" y2="30" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
        <rect x="83" y="28" width="3" height="8" rx="1" fill="#a5b4fc" opacity="0.35" />
        {/* Energy lines */}
        <path d="M28 14 L32 12" stroke="#a5b4fc" strokeWidth="0.8" opacity="0.25" />
        <path d="M28 18 L32 18" stroke="#a5b4fc" strokeWidth="0.8" opacity="0.25" />
        <path d="M92 14 L88 12" stroke="#a5b4fc" strokeWidth="0.8" opacity="0.25" />
        <path d="M92 18 L88 18" stroke="#a5b4fc" strokeWidth="0.8" opacity="0.25" />
      </svg>
    ),
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

export function getExerciseColor(muscleGroup) {
  const data = MUSCLE_DATA[muscleGroup] || MUSCLE_DATA["full body"];
  return { bg: data.bg, accent: data.accent };
}

// Banner: wide illustration header for exercise cards
export function ExerciseBanner({ muscleGroup, className = "" }) {
  const data = MUSCLE_DATA[muscleGroup] || MUSCLE_DATA["full body"];
  return (
    <div className={`w-full h-20 rounded-t-xl overflow-hidden ${className}`}>
      {data.bannerSvg()}
    </div>
  );
}

// Default: small square icon
export default function ExerciseThumbnail({ muscleGroup, size = 36 }) {
  const data = MUSCLE_DATA[muscleGroup] || MUSCLE_DATA["full body"];
  return (
    <div style={{ width: size, height: size, minWidth: size, minHeight: size, flexShrink: 0, lineHeight: 0 }}>
      {data.iconSvg(size)}
    </div>
  );
}
