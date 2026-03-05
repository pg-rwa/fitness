module.exports = [
  // BICEPS
  {
    name: "Barbell Curl", description: "Classic bicep mass builder. Heavy loading with simple mechanics.",
    category: "strength", muscle_group: "arms", secondary_muscles: '["forearms"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Stand, underhand grip shoulder-width\n2. Elbows pinned to sides\n3. Curl bar toward shoulders\n4. Squeeze biceps at top\n5. Lower slowly",
  },
  {
    name: "Hammer Curl", description: "Neutral grip targeting brachialis and brachioradialis for arm thickness.",
    category: "strength", muscle_group: "arms", secondary_muscles: '["forearms","brachialis"]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. Neutral grip (palms facing each other)\n2. Curl simultaneously or alternating\n3. Elbows stationary\n4. Squeeze at top\n5. Lower with control",
  },
  {
    name: "Preacher Curl", description: "Strict bicep isolation. Arms braced against pad eliminates cheating.",
    category: "strength", muscle_group: "arms", secondary_muscles: '["forearms"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Arms over preacher pad\n2. Underhand grip on EZ bar\n3. Curl toward shoulders\n4. Squeeze at top\n5. Lower slowly, don't fully lock",
  },
  {
    name: "Concentration Curl", description: "Single-arm seated curl. Maximum peak contraction and mind-muscle connection.",
    category: "strength", muscle_group: "arms", secondary_muscles: '[]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. Sit, brace elbow against inner thigh\n2. Arm fully extended with dumbbell\n3. Curl toward shoulder\n4. Squeeze hard at top\n5. Lower to full extension",
  },
  {
    name: "Incline Dumbbell Curl", description: "Incline bench curls stretching the long head. Builds bicep peak.",
    category: "strength", muscle_group: "arms", secondary_muscles: '["forearms"]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. Lie back on 45-degree incline\n2. Arms hanging with dumbbells\n3. Curl both up\n4. Squeeze at top\n5. Lower slowly, feel the stretch",
  },
  // TRICEPS
  {
    name: "Tricep Dip", description: "Bodyweight compound for tricep mass. Parallel bars or bench.",
    category: "strength", muscle_group: "arms", secondary_muscles: '["chest","anterior deltoids"]', equipment: "bodyweight", tracking_type: "reps_only",
    instructions: "1. Grip parallel bars, arms straight\n2. Keep torso upright\n3. Lower until elbows 90 degrees\n4. Push to full lockout\n5. Elbows close for tricep focus",
  },
  {
    name: "Skull Crusher", description: "Lying tricep extension heavily loading the long head. Key mass builder.",
    category: "strength", muscle_group: "arms", secondary_muscles: '[]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Lie flat, arms extended above chest\n2. Bend elbows to lower bar toward forehead\n3. Keep upper arms stationary\n4. Extend back to start\n5. Control the weight",
  },
  {
    name: "Tricep Pushdown", description: "Cable isolation for triceps. Rope, bar, or V-bar attachments.",
    category: "strength", muscle_group: "arms", secondary_muscles: '[]', equipment: "cable", tracking_type: "reps_weight",
    instructions: "1. Cable at top, attach rope or bar\n2. Elbows pinned at sides\n3. Push down to full extension\n4. Squeeze triceps at bottom\n5. Return slowly",
  },
  {
    name: "Overhead Tricep Extension", description: "Overhead stretch for long head of tricep. Maximum growth stimulus.",
    category: "strength", muscle_group: "arms", secondary_muscles: '[]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. Hold dumbbell overhead with both hands\n2. Lower behind head bending elbows\n3. Keep upper arms close to ears\n4. Extend back to start\n5. Squeeze triceps at top",
  },
  {
    name: "Close-Grip Bench Press", description: "Narrow grip bench shifting emphasis to triceps. Great for arm mass.",
    category: "strength", muscle_group: "arms", secondary_muscles: '["chest","anterior deltoids"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Shoulder-width grip on bar\n2. Lower to lower chest\n3. Elbows tucked close\n4. Press to full lockout\n5. Focus on tricep contraction",
  },
  // New exercises
  {
    name: "EZ Bar Curl", description: "Angled grip curl reducing wrist strain. Great for bicep mass.",
    category: "strength", muscle_group: "arms", secondary_muscles: '["forearms"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Grip EZ bar on angled portions\n2. Elbows at sides\n3. Curl to shoulders\n4. Squeeze at top\n5. Lower with control",
  },
  {
    name: "Cable Curl", description: "Bicep curl with constant cable tension. Great pump and isolation.",
    category: "strength", muscle_group: "arms", secondary_muscles: '["forearms"]', equipment: "cable", tracking_type: "reps_weight",
    instructions: "1. Low cable with bar or rope\n2. Elbows at sides\n3. Curl to shoulders\n4. Squeeze biceps\n5. Lower slowly",
  },
  {
    name: "Spider Curl", description: "Curl on vertical side of preacher bench. Intense peak contraction.",
    category: "strength", muscle_group: "arms", secondary_muscles: '["forearms"]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. Lean against vertical side of preacher bench\n2. Arms hanging straight down\n3. Curl up, squeeze at top\n4. No momentum possible\n5. Lower fully each rep",
  },
  {
    name: "Reverse Curl", description: "Overhand grip curl targeting brachioradialis and forearm extensors.",
    category: "strength", muscle_group: "arms", secondary_muscles: '["forearms","brachialis"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Overhand grip on barbell\n2. Elbows pinned at sides\n3. Curl up keeping overhand grip\n4. Squeeze at top\n5. Lower with control",
  },
  {
    name: "Cable Overhead Tricep Extension", description: "Cable tricep extension from overhead. Constant tension on long head.",
    category: "strength", muscle_group: "arms", secondary_muscles: '[]', equipment: "cable", tracking_type: "reps_weight",
    instructions: "1. Face away from high cable with rope\n2. Arms overhead, elbows bent\n3. Extend arms forward and up\n4. Squeeze triceps\n5. Return behind head slowly",
  },
  {
    name: "Tricep Kickback", description: "Dumbbell tricep isolation with arm extended behind. Peak contraction.",
    category: "strength", muscle_group: "arms", secondary_muscles: '[]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. Hinge forward, upper arm parallel to floor\n2. Extend forearm back until straight\n3. Squeeze tricep at lockout\n4. Lower slowly\n5. Keep upper arm still",
  },
  {
    name: "Wrist Curl", description: "Forearm flexor isolation. Builds grip strength and forearm size.",
    category: "strength", muscle_group: "arms", secondary_muscles: '[]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. Forearms on thighs, palms up\n2. Curl wrists up\n3. Squeeze at top\n4. Lower slowly\n5. Full range of motion",
  },
  {
    name: "Reverse Wrist Curl", description: "Forearm extensor isolation. Balances forearm development.",
    category: "strength", muscle_group: "arms", secondary_muscles: '[]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. Forearms on thighs, palms down\n2. Extend wrists up\n3. Squeeze at top\n4. Lower slowly\n5. Light weight, high reps",
  },
  {
    name: "Diamond Push-Up", description: "Close-hand push-up emphasizing triceps. Bodyweight tricep builder.",
    category: "strength", muscle_group: "arms", secondary_muscles: '["chest","anterior deltoids"]', equipment: null, tracking_type: "reps_only",
    instructions: "1. Push-up position, hands together forming diamond\n2. Lower chest to hands\n3. Push back up\n4. Keep elbows close to body\n5. Core tight throughout",
  },
  {
    name: "Zottman Curl", description: "Curl up with supination, lower with pronation. Hits all forearm muscles.",
    category: "strength", muscle_group: "arms", secondary_muscles: '["forearms","brachialis"]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. Supinated curl to top\n2. Rotate to overhand at top\n3. Lower slowly with overhand grip\n4. Rotate back to supinated at bottom\n5. Repeat",
  },
];
