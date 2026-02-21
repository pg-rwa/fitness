/**
 * Workout templates with exercise assignments.
 * Each template references exercises by name (resolved to IDs at seed time).
 */
module.exports = [
  // ===== PUSH / PULL / LEGS SPLIT =====
  {
    name: "Push Day - Chest, Shoulders & Triceps",
    description: "Classic push day targeting all pressing muscles. Start with heavy compound lifts then isolate each muscle group.",
    category: "strength", difficulty: "intermediate", estimated_duration_min: 60, is_public: 1,
    exercises: [
      { name: "Barbell Bench Press", target_sets: 4, target_reps: 8, rest_seconds: 120, sort_order: 1 },
      { name: "Incline Dumbbell Press", target_sets: 3, target_reps: 10, rest_seconds: 90, sort_order: 2 },
      { name: "Overhead Press", target_sets: 3, target_reps: 8, rest_seconds: 90, sort_order: 3 },
      { name: "Lateral Raise", target_sets: 3, target_reps: 15, rest_seconds: 60, sort_order: 4 },
      { name: "Cable Flye", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 5 },
      { name: "Tricep Pushdown", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 6 },
      { name: "Overhead Tricep Extension", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 7 },
    ]
  },
  {
    name: "Pull Day - Back & Biceps",
    description: "Complete pull session hitting lats, mid-back, rear delts, and biceps with heavy rows and pulls.",
    category: "strength", difficulty: "intermediate", estimated_duration_min: 60, is_public: 1,
    exercises: [
      { name: "Deadlift", target_sets: 4, target_reps: 5, rest_seconds: 180, sort_order: 1 },
      { name: "Pull-Up", target_sets: 3, target_reps: 8, rest_seconds: 120, sort_order: 2 },
      { name: "Barbell Row", target_sets: 3, target_reps: 10, rest_seconds: 90, sort_order: 3 },
      { name: "Seated Cable Row", target_sets: 3, target_reps: 12, rest_seconds: 90, sort_order: 4 },
      { name: "Face Pull", target_sets: 3, target_reps: 15, rest_seconds: 60, sort_order: 5 },
      { name: "Barbell Curl", target_sets: 3, target_reps: 10, rest_seconds: 60, sort_order: 6 },
      { name: "Hammer Curl", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 7 },
    ]
  },
  {
    name: "Leg Day - Quads, Hams & Glutes",
    description: "Complete lower body session with squats, hip hinges, and isolation work for balanced leg development.",
    category: "strength", difficulty: "intermediate", estimated_duration_min: 65, is_public: 1,
    exercises: [
      { name: "Barbell Squat", target_sets: 4, target_reps: 6, rest_seconds: 180, sort_order: 1 },
      { name: "Romanian Deadlift", target_sets: 3, target_reps: 10, rest_seconds: 120, sort_order: 2 },
      { name: "Leg Press", target_sets: 3, target_reps: 12, rest_seconds: 90, sort_order: 3 },
      { name: "Leg Curl", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 4 },
      { name: "Leg Extension", target_sets: 3, target_reps: 15, rest_seconds: 60, sort_order: 5 },
      { name: "Hip Thrust", target_sets: 3, target_reps: 12, rest_seconds: 90, sort_order: 6 },
      { name: "Standing Calf Raise", target_sets: 4, target_reps: 15, rest_seconds: 60, sort_order: 7 },
    ]
  },

  // ===== UPPER / LOWER SPLIT =====
  {
    name: "Upper Body Power",
    description: "Heavy upper body session focusing on compound lifts for chest, back, and shoulders. Strength-focused.",
    category: "strength", difficulty: "intermediate", estimated_duration_min: 55, is_public: 1,
    exercises: [
      { name: "Barbell Bench Press", target_sets: 4, target_reps: 6, rest_seconds: 150, sort_order: 1 },
      { name: "Barbell Row", target_sets: 4, target_reps: 6, rest_seconds: 150, sort_order: 2 },
      { name: "Overhead Press", target_sets: 3, target_reps: 8, rest_seconds: 120, sort_order: 3 },
      { name: "Chin-Up", target_sets: 3, target_reps: 8, rest_seconds: 120, sort_order: 4 },
      { name: "Dumbbell Flye", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 5 },
      { name: "Barbell Curl", target_sets: 3, target_reps: 10, rest_seconds: 60, sort_order: 6 },
      { name: "Skull Crusher", target_sets: 3, target_reps: 10, rest_seconds: 60, sort_order: 7 },
    ]
  },
  {
    name: "Lower Body Power",
    description: "Heavy lower body session with squats and deadlifts. Builds raw leg strength and power.",
    category: "strength", difficulty: "intermediate", estimated_duration_min: 55, is_public: 1,
    exercises: [
      { name: "Barbell Squat", target_sets: 4, target_reps: 5, rest_seconds: 180, sort_order: 1 },
      { name: "Romanian Deadlift", target_sets: 4, target_reps: 8, rest_seconds: 120, sort_order: 2 },
      { name: "Bulgarian Split Squat", target_sets: 3, target_reps: 10, rest_seconds: 90, sort_order: 3 },
      { name: "Leg Curl", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 4 },
      { name: "Hip Thrust", target_sets: 3, target_reps: 10, rest_seconds: 90, sort_order: 5 },
      { name: "Standing Calf Raise", target_sets: 4, target_reps: 15, rest_seconds: 60, sort_order: 6 },
    ]
  },

  // ===== FULL BODY =====
  {
    name: "Full Body Strength - Day A",
    description: "Balanced full body workout hitting all major muscle groups. Perfect for 3-day-per-week training.",
    category: "strength", difficulty: "beginner", estimated_duration_min: 50, is_public: 1,
    exercises: [
      { name: "Barbell Squat", target_sets: 3, target_reps: 8, rest_seconds: 120, sort_order: 1 },
      { name: "Barbell Bench Press", target_sets: 3, target_reps: 8, rest_seconds: 120, sort_order: 2 },
      { name: "Barbell Row", target_sets: 3, target_reps: 8, rest_seconds: 120, sort_order: 3 },
      { name: "Overhead Press", target_sets: 3, target_reps: 10, rest_seconds: 90, sort_order: 4 },
      { name: "Barbell Curl", target_sets: 2, target_reps: 12, rest_seconds: 60, sort_order: 5 },
      { name: "Plank", target_sets: 3, target_reps: 60, rest_seconds: 60, sort_order: 6, notes: "Hold for 60 seconds" },
    ]
  },
  {
    name: "Full Body Strength - Day B",
    description: "Alternating full body workout. Pair with Day A for a complete 3-day program.",
    category: "strength", difficulty: "beginner", estimated_duration_min: 50, is_public: 1,
    exercises: [
      { name: "Deadlift", target_sets: 3, target_reps: 5, rest_seconds: 150, sort_order: 1 },
      { name: "Incline Dumbbell Press", target_sets: 3, target_reps: 10, rest_seconds: 90, sort_order: 2 },
      { name: "Lat Pulldown", target_sets: 3, target_reps: 10, rest_seconds: 90, sort_order: 3 },
      { name: "Lunges", target_sets: 3, target_reps: 12, rest_seconds: 90, sort_order: 4 },
      { name: "Lateral Raise", target_sets: 3, target_reps: 15, rest_seconds: 60, sort_order: 5 },
      { name: "Hanging Leg Raise", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 6 },
    ]
  },

  // ===== HYPERTROPHY =====
  {
    name: "Chest & Back Hypertrophy",
    description: "High-volume push/pull superset workout for maximum chest and back muscle growth.",
    category: "hypertrophy", difficulty: "advanced", estimated_duration_min: 70, is_public: 1,
    exercises: [
      { name: "Incline Dumbbell Press", target_sets: 4, target_reps: 10, rest_seconds: 90, sort_order: 1 },
      { name: "Pull-Up", target_sets: 4, target_reps: 10, rest_seconds: 90, sort_order: 2 },
      { name: "Cable Flye", target_sets: 4, target_reps: 12, rest_seconds: 60, sort_order: 3 },
      { name: "Seated Cable Row", target_sets: 4, target_reps: 12, rest_seconds: 60, sort_order: 4 },
      { name: "Dips (Chest Focus)", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 5 },
      { name: "Single-Arm Dumbbell Row", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 6 },
      { name: "Dumbbell Pullover", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 7 },
    ]
  },
  {
    name: "Arms Blaster",
    description: "Dedicated arm day alternating biceps and triceps for maximum pump and growth.",
    category: "hypertrophy", difficulty: "intermediate", estimated_duration_min: 45, is_public: 1,
    exercises: [
      { name: "Barbell Curl", target_sets: 3, target_reps: 10, rest_seconds: 60, sort_order: 1 },
      { name: "Close-Grip Bench Press", target_sets: 3, target_reps: 10, rest_seconds: 60, sort_order: 2 },
      { name: "Incline Dumbbell Curl", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 3 },
      { name: "Skull Crusher", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 4 },
      { name: "Hammer Curl", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 5 },
      { name: "Tricep Pushdown", target_sets: 3, target_reps: 15, rest_seconds: 45, sort_order: 6 },
      { name: "Concentration Curl", target_sets: 2, target_reps: 15, rest_seconds: 45, sort_order: 7 },
    ]
  },
  {
    name: "Shoulder Sculptor",
    description: "High-volume shoulder workout for 3D delts. Covers all three heads of the deltoid.",
    category: "hypertrophy", difficulty: "intermediate", estimated_duration_min: 45, is_public: 1,
    exercises: [
      { name: "Dumbbell Shoulder Press", target_sets: 4, target_reps: 10, rest_seconds: 90, sort_order: 1 },
      { name: "Arnold Press", target_sets: 3, target_reps: 12, rest_seconds: 90, sort_order: 2 },
      { name: "Lateral Raise", target_sets: 4, target_reps: 15, rest_seconds: 45, sort_order: 3 },
      { name: "Cable Lateral Raise", target_sets: 3, target_reps: 15, rest_seconds: 45, sort_order: 4 },
      { name: "Reverse Flye", target_sets: 4, target_reps: 15, rest_seconds: 45, sort_order: 5 },
      { name: "Barbell Shrug", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 6 },
    ]
  },

  // ===== HIIT =====
  {
    name: "HIIT Fat Burner",
    description: "High-intensity interval circuit combining cardio and bodyweight exercises. Torch calories in 30 minutes.",
    category: "hiit", difficulty: "intermediate", estimated_duration_min: 30, is_public: 1,
    exercises: [
      { name: "Burpees", target_sets: 4, target_reps: 10, rest_seconds: 30, sort_order: 1 },
      { name: "Mountain Climber", target_sets: 4, target_reps: 20, rest_seconds: 30, sort_order: 2 },
      { name: "Jump Rope", target_sets: 4, target_reps: 60, rest_seconds: 30, sort_order: 3, notes: "60 seconds per set" },
      { name: "Kettlebell Swing", target_sets: 4, target_reps: 15, rest_seconds: 30, sort_order: 4 },
      { name: "Box Jump", target_sets: 4, target_reps: 10, rest_seconds: 30, sort_order: 5 },
      { name: "Battle Ropes", target_sets: 4, target_reps: 30, rest_seconds: 30, sort_order: 6, notes: "30 seconds per set" },
    ]
  },
  {
    name: "Bodyweight HIIT",
    description: "No equipment needed. Intense bodyweight circuit you can do anywhere. Great for travel or home.",
    category: "hiit", difficulty: "beginner", estimated_duration_min: 25, is_public: 1,
    exercises: [
      { name: "Burpees", target_sets: 3, target_reps: 8, rest_seconds: 30, sort_order: 1 },
      { name: "Push-Up", target_sets: 3, target_reps: 15, rest_seconds: 30, sort_order: 2 },
      { name: "Mountain Climber", target_sets: 3, target_reps: 20, rest_seconds: 30, sort_order: 3 },
      { name: "Lunges", target_sets: 3, target_reps: 12, rest_seconds: 30, sort_order: 4 },
      { name: "Plank", target_sets: 3, target_reps: 30, rest_seconds: 30, sort_order: 5, notes: "Hold 30 seconds" },
      { name: "Russian Twist", target_sets: 3, target_reps: 20, rest_seconds: 30, sort_order: 6 },
    ]
  },

  // ===== CORE FOCUSED =====
  {
    name: "Core Crusher",
    description: "Dedicated core workout targeting abs, obliques, and deep stabilizers. 6-pack builder.",
    category: "strength", difficulty: "intermediate", estimated_duration_min: 30, is_public: 1,
    exercises: [
      { name: "Hanging Leg Raise", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 1 },
      { name: "Ab Rollout", target_sets: 3, target_reps: 10, rest_seconds: 60, sort_order: 2 },
      { name: "Cable Woodchop", target_sets: 3, target_reps: 12, rest_seconds: 45, sort_order: 3 },
      { name: "Russian Twist", target_sets: 3, target_reps: 20, rest_seconds: 45, sort_order: 4 },
      { name: "Dead Bug", target_sets: 3, target_reps: 10, rest_seconds: 45, sort_order: 5 },
      { name: "Plank", target_sets: 3, target_reps: 60, rest_seconds: 45, sort_order: 6, notes: "60 seconds per set" },
    ]
  },

  // ===== BEGINNER =====
  {
    name: "Beginner Total Body",
    description: "Simple, effective full-body routine for gym beginners. Machine and bodyweight exercises for safe progression.",
    category: "strength", difficulty: "beginner", estimated_duration_min: 40, is_public: 1,
    exercises: [
      { name: "Goblet Squat", target_sets: 3, target_reps: 12, rest_seconds: 90, sort_order: 1 },
      { name: "Machine Chest Press", target_sets: 3, target_reps: 12, rest_seconds: 90, sort_order: 2 },
      { name: "Lat Pulldown", target_sets: 3, target_reps: 12, rest_seconds: 90, sort_order: 3 },
      { name: "Leg Press", target_sets: 3, target_reps: 12, rest_seconds: 90, sort_order: 4 },
      { name: "Dumbbell Shoulder Press", target_sets: 3, target_reps: 12, rest_seconds: 60, sort_order: 5 },
      { name: "Plank", target_sets: 3, target_reps: 30, rest_seconds: 60, sort_order: 6, notes: "Hold 30 seconds" },
    ]
  },

  // ===== CARDIO =====
  {
    name: "Cardio Conditioning Circuit",
    description: "Mixed cardio session alternating equipment for sustained calorie burn and cardiovascular health.",
    category: "cardio", difficulty: "beginner", estimated_duration_min: 40, is_public: 1,
    exercises: [
      { name: "Rowing Machine", target_sets: 1, target_reps: 1, rest_seconds: 60, sort_order: 1, notes: "10 minutes moderate pace" },
      { name: "Cycling", target_sets: 1, target_reps: 1, rest_seconds: 60, sort_order: 2, notes: "10 minutes intervals: 30s hard / 30s easy" },
      { name: "Stair Climber", target_sets: 1, target_reps: 1, rest_seconds: 60, sort_order: 3, notes: "10 minutes steady pace" },
      { name: "Jump Rope", target_sets: 3, target_reps: 60, rest_seconds: 30, sort_order: 4, notes: "60 seconds per set" },
    ]
  },

  // ===== FLEXIBILITY =====
  {
    name: "Recovery & Mobility Session",
    description: "Active recovery day focused on flexibility, mobility, and reducing soreness. Do this on rest days.",
    category: "flexibility", difficulty: "beginner", estimated_duration_min: 35, is_public: 1,
    exercises: [
      { name: "Foam Rolling Recovery", target_sets: 1, target_reps: 1, rest_seconds: 0, sort_order: 1, notes: "10 minutes full body" },
      { name: "Dynamic Stretching Routine", target_sets: 1, target_reps: 1, rest_seconds: 0, sort_order: 2, notes: "5 minutes" },
      { name: "Hip Mobility Flow", target_sets: 1, target_reps: 1, rest_seconds: 0, sort_order: 3, notes: "5 minutes" },
      { name: "Yoga Flow", target_sets: 1, target_reps: 1, rest_seconds: 0, sort_order: 4, notes: "15 minutes" },
    ]
  },
];
