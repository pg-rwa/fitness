module.exports = [
  // ===== CORE =====
  {
    name: "Plank", description: "Isometric core exercise building endurance and stability. Foundation of core training.",
    category: "strength", muscle_group: "core", secondary_muscles: '["shoulders","glutes"]', equipment: null,
    instructions: "1. Forearms and toes on ground\n2. Body in straight line\n3. Brace core tight\n4. Don't let hips sag or pike\n5. Hold for prescribed time",
    video_url: "https://www.youtube.com/results?search_query=plank+proper+form"
  },
  {
    name: "Crunch", description: "Basic abdominal flexion. Targets rectus abdominis (six-pack).",
    category: "strength", muscle_group: "core", secondary_muscles: '[]', equipment: null,
    instructions: "1. Lie back, knees bent, feet flat\n2. Hands behind head or across chest\n3. Curl shoulders off ground\n4. Squeeze abs at top\n5. Lower slowly",
    video_url: "https://www.youtube.com/results?search_query=crunch+proper+form"
  },
  {
    name: "Russian Twist", description: "Rotational core targeting obliques. Bodyweight or weighted.",
    category: "strength", muscle_group: "core", secondary_muscles: '["obliques"]', equipment: null,
    instructions: "1. Sit, knees bent, lean back slightly\n2. Lift feet off ground (optional)\n3. Rotate torso side to side\n4. Keep core braced\n5. Control the rotation",
    video_url: "https://www.youtube.com/results?search_query=russian+twist+form"
  },
  {
    name: "Hanging Leg Raise", description: "Advanced lower ab exercise. Hang from bar, lift legs.",
    category: "strength", muscle_group: "core", secondary_muscles: '["hip flexors"]', equipment: "bodyweight",
    instructions: "1. Hang from pull-up bar\n2. Legs straight or slightly bent\n3. Raise legs to parallel or higher\n4. Lower slowly\n5. Avoid swinging",
    video_url: "https://www.youtube.com/results?search_query=hanging+leg+raise+form"
  },
  {
    name: "Ab Rollout", description: "Anti-extension exercise using ab wheel. Incredible core strength builder.",
    category: "strength", muscle_group: "core", secondary_muscles: '["lats","shoulders"]', equipment: "other",
    instructions: "1. Kneel holding ab wheel\n2. Roll forward extending body\n3. Go as far as form allows\n4. Pull back using core\n5. Keep back flat throughout",
    video_url: "https://www.youtube.com/results?search_query=ab+rollout+form"
  },
  {
    name: "Mountain Climber", description: "Dynamic core + cardio. Rapid knee drives in plank position.",
    category: "strength", muscle_group: "core", secondary_muscles: '["hip flexors","shoulders","quads"]', equipment: null,
    instructions: "1. High plank position\n2. Drive one knee toward chest\n3. Quickly switch legs\n4. Keep hips level\n5. Steady rhythm",
    video_url: "https://www.youtube.com/results?search_query=mountain+climbers+form"
  },
  {
    name: "Cable Woodchop", description: "Rotational core movement. Builds functional power.",
    category: "strength", muscle_group: "core", secondary_muscles: '["obliques","shoulders"]', equipment: "cable",
    instructions: "1. Cable at high or low position\n2. Stand sideways to machine\n3. Pull handle diagonally across body\n4. Rotate through core, not arms\n5. Control the return",
    video_url: "https://www.youtube.com/results?search_query=cable+woodchop+form"
  },
  {
    name: "Dead Bug", description: "Anti-extension core exercise on back. Teaches bracing and coordination.",
    category: "strength", muscle_group: "core", secondary_muscles: '["hip flexors"]', equipment: null,
    instructions: "1. Lie back, arms up, knees at 90\n2. Press lower back into floor\n3. Extend opposite arm and leg\n4. Return and switch sides\n5. Lower back stays down",
    video_url: "https://www.youtube.com/results?search_query=dead+bug+exercise+form"
  },

  // ===== CARDIO =====
  {
    name: "Running", description: "Fundamental cardio. Steady-state or intervals for different goals.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["quads","hamstrings","calves","core"]', equipment: null,
    instructions: "1. 5-minute walking warm-up\n2. Upright posture, slight forward lean\n3. Land midfoot\n4. Arms relaxed at 90 degrees\n5. Breathe rhythmically",
    video_url: "https://www.youtube.com/results?search_query=proper+running+form"
  },
  {
    name: "Cycling", description: "Low-impact cardio building leg endurance. Great for recovery or HIIT.",
    category: "cardio", muscle_group: "legs", secondary_muscles: '["glutes","core"]', equipment: "bike",
    instructions: "1. Seat height: slight bend at bottom\n2. Core engaged, back neutral\n3. Smooth pedal circles\n4. 80-100 RPM steady state\n5. Adjust resistance for intensity",
    video_url: "https://www.youtube.com/results?search_query=indoor+cycling+form"
  },
  {
    name: "Rowing Machine", description: "Full-body cardio working 86% of muscles. Builds aerobic and anaerobic capacity.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["back","legs","arms","core"]', equipment: "machine",
    instructions: "1. Strap feet, overhand grip\n2. Start: legs bent, arms extended (catch)\n3. Drive legs, lean back, pull arms\n4. Reverse: arms-body-legs\n5. Maintain rhythm",
    video_url: "https://www.youtube.com/results?search_query=rowing+machine+technique"
  },
  {
    name: "Jump Rope", description: "High-intensity cardio improving coordination and agility. A boxer's staple.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["calves","shoulders","forearms"]', equipment: "jump rope",
    instructions: "1. Rope handles reach armpits when standing on center\n2. Elbows close to body\n3. Turn with wrists, not arms\n4. Jump just enough to clear\n5. Land softly on balls of feet",
    video_url: "https://www.youtube.com/results?search_query=jump+rope+technique"
  },
  {
    name: "Burpees", description: "Full-body cardio and strength combo. One of the most demanding bodyweight exercises.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["chest","legs","core","shoulders"]', equipment: null,
    instructions: "1. Squat down, hands on floor\n2. Jump feet back to plank\n3. Perform a push-up\n4. Jump feet forward to hands\n5. Explode into jump with arms overhead",
    video_url: "https://www.youtube.com/results?search_query=burpees+proper+form"
  },
  {
    name: "Battle Ropes", description: "High-intensity upper body cardio. Builds grip, shoulders, and conditioning.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["shoulders","arms","core"]', equipment: "other",
    instructions: "1. Athletic stance, hold rope ends\n2. Alternate arms up and down for waves\n3. Core braced, knees slightly bent\n4. Maintain intensity for time\n5. Try slams, circles, snakes",
    video_url: "https://www.youtube.com/results?search_query=battle+ropes+tutorial"
  },
  {
    name: "Kettlebell Swing", description: "Explosive hip hinge building posterior chain power and cardio fitness.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["glutes","hamstrings","core","shoulders"]', equipment: "kettlebell",
    instructions: "1. Feet wider than shoulder-width\n2. Hinge, grip kettlebell both hands\n3. Swing between legs\n4. Drive hips forward to chest height\n5. Let gravity return, repeat",
    video_url: "https://www.youtube.com/results?search_query=kettlebell+swing+form"
  },
  {
    name: "Box Jump", description: "Plyometric building explosive lower body power. Develops fast-twitch fibers.",
    category: "cardio", muscle_group: "legs", secondary_muscles: '["glutes","core","calves"]', equipment: "other",
    instructions: "1. Face a sturdy box\n2. Swing arms back, load hips\n3. Explode up onto box\n4. Land softly, both feet\n5. Stand up, step down",
    video_url: "https://www.youtube.com/results?search_query=box+jump+form"
  },
  {
    name: "Stair Climber", description: "Low-impact cardio targeting glutes and quads. Great calorie burner.",
    category: "cardio", muscle_group: "legs", secondary_muscles: '["glutes","calves","core"]', equipment: "machine",
    instructions: "1. Step on, select pace\n2. Stand upright, light grip\n3. Drive through full foot\n4. Don't lean on handles\n5. Steady rhythm",
    video_url: "https://www.youtube.com/results?search_query=stair+climber+form"
  },

  // ===== FLEXIBILITY =====
  {
    name: "Yoga Flow", description: "Flowing yoga poses improving flexibility, balance, and focus.",
    category: "flexibility", muscle_group: "full body", secondary_muscles: '["core","shoulders","hips"]', equipment: null,
    instructions: "1. Start in mountain pose, center breathing\n2. Flow through sun salutation\n3. Hold each pose 3-5 breaths\n4. Smooth transitions\n5. End in savasana",
    video_url: "https://www.youtube.com/results?search_query=yoga+flow+for+athletes"
  },
  {
    name: "Dynamic Stretching Routine", description: "Active stretching for warm-up. Prepares muscles and joints.",
    category: "flexibility", muscle_group: "full body", secondary_muscles: '["hips","shoulders","hamstrings"]', equipment: null,
    instructions: "1. Arm circles forward/backward\n2. Leg swings front-back, side-side\n3. Walking lunges with twist\n4. High knees and butt kicks\n5. Hip circles",
    video_url: "https://www.youtube.com/results?search_query=dynamic+stretching+routine"
  },
  {
    name: "Foam Rolling Recovery", description: "Self-myofascial release. Reduces soreness, improves mobility.",
    category: "flexibility", muscle_group: "full body", secondary_muscles: '[]', equipment: "other",
    instructions: "1. Roller under target muscle\n2. Roll slowly back and forth\n3. Pause on tender spots 20-30s\n4. Moderate pressure\n5. 1-2 minutes per muscle",
    video_url: "https://www.youtube.com/results?search_query=foam+rolling+recovery"
  },
  {
    name: "Hip Mobility Flow", description: "Targeted hip mobility. Essential for squat depth and back health.",
    category: "flexibility", muscle_group: "legs", secondary_muscles: '["core","lower back"]', equipment: null,
    instructions: "1. 90/90 hip stretch each side\n2. Pigeon pose each side\n3. Deep squat hold\n4. Hip circles on all fours\n5. Couch stretch for hip flexors",
    video_url: "https://www.youtube.com/results?search_query=hip+mobility+routine"
  },
  {
    name: "Farmer's Walk", description: "Loaded carry for grip, traps, core stability, and total conditioning.",
    category: "strength", muscle_group: "full body", secondary_muscles: '["traps","forearms","core","legs"]', equipment: "dumbbell",
    instructions: "1. Pick up heavy dumbbells\n2. Stand tall, shoulders back\n3. Walk with controlled steps\n4. Core braced, grip tight\n5. Walk for distance or time",
    video_url: "https://www.youtube.com/results?search_query=farmers+walk+form"
  },
  {
    name: "Dumbbell Pullover", description: "Stretches and works chest and lats simultaneously. Great for expansion.",
    category: "strength", muscle_group: "chest", secondary_muscles: '["lats","triceps","serratus anterior"]', equipment: "dumbbell",
    instructions: "1. Lie across bench, upper back supported\n2. Hold one dumbbell over chest\n3. Lower behind head in arc\n4. Feel stretch in chest and lats\n5. Pull back over chest",
    video_url: "https://www.youtube.com/results?search_query=dumbbell+pullover+form"
  },
];
