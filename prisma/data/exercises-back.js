module.exports = [
  {
    name: "Deadlift", description: "Ultimate full-body strength builder. Targets posterior chain - back, glutes, hamstrings.",
    category: "strength", muscle_group: "back", secondary_muscles: '["glutes","hamstrings","core","traps","forearms"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Feet hip-width, bar over mid-foot\n2. Hinge hips, grip bar outside knees\n3. Flat back, brace core, chest up\n4. Drive through feet, extend hips and knees\n5. Lock out at top, reverse to lower",
  },
  {
    name: "Pull-Up", description: "Gold standard for lat development. Bodyweight vertical pull.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","rear deltoids","forearms"]', equipment: "bodyweight", tracking_type: "reps_only",
    instructions: "1. Hang overhand grip, slightly wider than shoulders\n2. Retract shoulder blades, engage lats\n3. Pull chin above bar\n4. Lower with control to full extension\n5. Avoid swinging or kipping",
  },
  {
    name: "Barbell Row", description: "Heavy compound row for thick back. Targets mid-back and lats.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","rear deltoids","core"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Hinge forward, back flat at ~45 degrees\n2. Grip slightly wider than shoulder width\n3. Pull bar to lower chest/upper abs\n4. Squeeze shoulder blades at top\n5. Lower with control",
  },
  {
    name: "Lat Pulldown", description: "Machine vertical pull. Excellent for lat width and pull-up alternative.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","rear deltoids"]', equipment: "cable", tracking_type: "reps_weight",
    instructions: "1. Sit, secure thighs under pad\n2. Wide overhand grip\n3. Pull bar to upper chest\n4. Squeeze lats at bottom\n5. Return slowly to full stretch",
  },
  {
    name: "Seated Cable Row", description: "Horizontal pull for mid-back thickness. Constant cable tension.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","rear deltoids","rhomboids"]', equipment: "cable", tracking_type: "reps_weight",
    instructions: "1. Sit, feet on platform, knees slightly bent\n2. Grip V-bar or handle\n3. Pull to lower chest/upper abs\n4. Squeeze shoulder blades\n5. Extend arms slowly",
  },
  {
    name: "T-Bar Row", description: "Heavy row variation using landmine. Serious back thickness builder.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","rear deltoids","rhomboids"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Straddle bar, hinge forward\n2. Grip handle with both hands\n3. Pull to chest, drive elbows back\n4. Squeeze at top\n5. Lower under control",
  },
  {
    name: "Face Pull", description: "Essential for rear delts and rotator cuff health. Fixes posture.",
    category: "strength", muscle_group: "back", secondary_muscles: '["rear deltoids","rotator cuff","traps"]', equipment: "cable", tracking_type: "reps_weight",
    instructions: "1. Cable at face height with rope\n2. Pull toward face, separate rope ends\n3. Externally rotate shoulders\n4. Hold 1-2 seconds\n5. Return slowly",
  },
  {
    name: "Single-Arm Dumbbell Row", description: "Unilateral row fixing imbalances. Heavy loading with back support.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","rear deltoids"]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. One hand and knee on bench\n2. Hold dumbbell in free hand\n3. Row weight to hip\n4. Squeeze lat at top\n5. Lower with control",
  },
  {
    name: "Chin-Up", description: "Underhand pull-up increasing bicep involvement while working lats.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","forearms"]', equipment: "bodyweight", tracking_type: "reps_only",
    instructions: "1. Hang underhand grip, shoulder-width\n2. Pull chin above bar\n3. Squeeze biceps and lats\n4. Lower with control\n5. Full extension at bottom",
  },
  // New exercises
  {
    name: "Pendlay Row", description: "Strict barbell row from the floor each rep. Builds explosive back strength.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","rear deltoids","core"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Bar on floor, hinge to parallel\n2. Overhand grip slightly wider than shoulders\n3. Row explosively to lower chest\n4. Lower back to floor each rep\n5. Reset position between reps",
  },
  {
    name: "Meadows Row", description: "Landmine row variation for unilateral back thickness. Named after John Meadows.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","rear deltoids"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Stand perpendicular to landmine bar\n2. Staggered stance, grip end of bar\n3. Row to hip with elbow drive\n4. Squeeze lat at top\n5. Lower with control",
  },
  {
    name: "Chest-Supported Row", description: "Row with chest against incline bench. Eliminates cheating for strict back work.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","rear deltoids"]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. Lie face down on incline bench\n2. Hold dumbbells hanging below\n3. Row both to sides of bench\n4. Squeeze shoulder blades\n5. Lower with control",
  },
  {
    name: "Inverted Row", description: "Bodyweight horizontal row. Scalable difficulty by adjusting body angle.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","rear deltoids","core"]', equipment: "bodyweight", tracking_type: "reps_only",
    instructions: "1. Set bar at waist height\n2. Hang underneath, heels on floor\n3. Pull chest to bar\n4. Squeeze shoulder blades\n5. Lower with control",
  },
  {
    name: "Straight-Arm Pulldown", description: "Lat isolation with arms straight. Great for mind-muscle connection.",
    category: "strength", muscle_group: "back", secondary_muscles: '["teres major","core"]', equipment: "cable", tracking_type: "reps_weight",
    instructions: "1. Stand facing cable, arms extended high\n2. Keep arms straight throughout\n3. Pull bar down to thighs in arc\n4. Squeeze lats at bottom\n5. Return slowly overhead",
  },
  {
    name: "Rack Pull", description: "Partial deadlift from knee height. Overloads upper back and traps.",
    category: "strength", muscle_group: "back", secondary_muscles: '["traps","glutes","forearms"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Set safety pins at knee height\n2. Conventional deadlift grip\n3. Pull to lockout\n4. Squeeze upper back and traps\n5. Lower to pins with control",
  },
  {
    name: "Seal Row", description: "Lying face down on elevated bench for strict rowing. Zero momentum.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","rear deltoids"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Lie face down on elevated bench\n2. Arms hang with barbell below\n3. Row to bench\n4. Squeeze at top\n5. Lower fully each rep",
  },
  {
    name: "Close-Grip Lat Pulldown", description: "Narrow grip pulldown emphasizing lower lats and bicep involvement.",
    category: "strength", muscle_group: "back", secondary_muscles: '["biceps","forearms"]', equipment: "cable", tracking_type: "reps_weight",
    instructions: "1. Sit, attach V-bar to pulldown\n2. Lean back slightly\n3. Pull to upper chest\n4. Squeeze lats\n5. Return to full stretch",
  },
];
