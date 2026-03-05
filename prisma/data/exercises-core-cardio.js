module.exports = [
  // ===== CORE =====
  {
    name: "Plank", description: "Isometric core exercise building endurance and stability. Foundation of core training.",
    category: "strength", muscle_group: "core", secondary_muscles: '["shoulders","glutes"]', equipment: null, tracking_type: "duration",
    instructions: "1. Forearms and toes on ground\n2. Body in straight line\n3. Brace core tight\n4. Don't let hips sag or pike\n5. Hold for prescribed time",
  },
  {
    name: "Crunch", description: "Basic abdominal flexion. Targets rectus abdominis (six-pack).",
    category: "strength", muscle_group: "core", secondary_muscles: '[]', equipment: null, tracking_type: "reps_only",
    instructions: "1. Lie back, knees bent, feet flat\n2. Hands behind head or across chest\n3. Curl shoulders off ground\n4. Squeeze abs at top\n5. Lower slowly",
  },
  {
    name: "Russian Twist", description: "Rotational core targeting obliques. Bodyweight or weighted.",
    category: "strength", muscle_group: "core", secondary_muscles: '["obliques"]', equipment: null, tracking_type: "reps_only",
    instructions: "1. Sit, knees bent, lean back slightly\n2. Lift feet off ground (optional)\n3. Rotate torso side to side\n4. Keep core braced\n5. Control the rotation",
  },
  {
    name: "Hanging Leg Raise", description: "Advanced lower ab exercise. Hang from bar, lift legs.",
    category: "strength", muscle_group: "core", secondary_muscles: '["hip flexors"]', equipment: "bodyweight", tracking_type: "reps_only",
    instructions: "1. Hang from pull-up bar\n2. Legs straight or slightly bent\n3. Raise legs to parallel or higher\n4. Lower slowly\n5. Avoid swinging",
  },
  {
    name: "Ab Rollout", description: "Anti-extension exercise using ab wheel. Incredible core strength builder.",
    category: "strength", muscle_group: "core", secondary_muscles: '["lats","shoulders"]', equipment: "other", tracking_type: "reps_only",
    instructions: "1. Kneel holding ab wheel\n2. Roll forward extending body\n3. Go as far as form allows\n4. Pull back using core\n5. Keep back flat throughout",
  },
  {
    name: "Mountain Climber", description: "Dynamic core + cardio. Rapid knee drives in plank position.",
    category: "strength", muscle_group: "core", secondary_muscles: '["hip flexors","shoulders","quads"]', equipment: null, tracking_type: "reps_only",
    instructions: "1. High plank position\n2. Drive one knee toward chest\n3. Quickly switch legs\n4. Keep hips level\n5. Steady rhythm",
  },
  {
    name: "Cable Woodchop", description: "Rotational core movement. Builds functional power.",
    category: "strength", muscle_group: "core", secondary_muscles: '["obliques","shoulders"]', equipment: "cable", tracking_type: "reps_weight",
    instructions: "1. Cable at high or low position\n2. Stand sideways to machine\n3. Pull handle diagonally across body\n4. Rotate through core, not arms\n5. Control the return",
  },
  {
    name: "Dead Bug", description: "Anti-extension core exercise on back. Teaches bracing and coordination.",
    category: "strength", muscle_group: "core", secondary_muscles: '["hip flexors"]', equipment: null, tracking_type: "reps_only",
    instructions: "1. Lie back, arms up, knees at 90\n2. Press lower back into floor\n3. Extend opposite arm and leg\n4. Return and switch sides\n5. Lower back stays down",
  },
  // New core exercises
  {
    name: "Bicycle Crunch", description: "Dynamic crunch with rotation targeting all abdominal muscles.",
    category: "strength", muscle_group: "core", secondary_muscles: '["obliques","hip flexors"]', equipment: null, tracking_type: "reps_only",
    instructions: "1. Lie back, hands behind head\n2. Bring knee to opposite elbow\n3. Extend other leg straight\n4. Alternate sides\n5. Control the rotation",
  },
  {
    name: "Side Plank", description: "Lateral core stability exercise targeting obliques.",
    category: "strength", muscle_group: "core", secondary_muscles: '["obliques","shoulders"]', equipment: null, tracking_type: "duration",
    instructions: "1. Lie on side, forearm on ground\n2. Stack feet or stagger\n3. Lift hips to form straight line\n4. Hold position\n5. Don't let hips drop",
  },
  {
    name: "Pallof Press", description: "Anti-rotation core exercise using cable or band. Builds rotational stability.",
    category: "strength", muscle_group: "core", secondary_muscles: '["obliques","shoulders"]', equipment: "cable", tracking_type: "reps_weight",
    instructions: "1. Stand sideways to cable at chest height\n2. Hold handle at chest\n3. Press arms straight out\n4. Resist rotation\n5. Return to chest slowly",
  },
  {
    name: "V-Up", description: "Advanced crunch folding body in half. Works entire rectus abdominis.",
    category: "strength", muscle_group: "core", secondary_muscles: '["hip flexors"]', equipment: null, tracking_type: "reps_only",
    instructions: "1. Lie flat, arms overhead\n2. Simultaneously raise arms and legs\n3. Touch hands to feet at top\n4. Lower slowly\n5. Control throughout",
  },
  {
    name: "Toe Touch", description: "Lying crunch reaching for toes. Upper ab focus.",
    category: "strength", muscle_group: "core", secondary_muscles: '[]', equipment: null, tracking_type: "reps_only",
    instructions: "1. Lie back, legs straight up\n2. Reach hands toward toes\n3. Curl shoulders off ground\n4. Touch toes at top\n5. Lower slowly",
  },
  {
    name: "Flutter Kick", description: "Lying leg kicks for lower abs and hip flexors.",
    category: "strength", muscle_group: "core", secondary_muscles: '["hip flexors"]', equipment: null, tracking_type: "duration",
    instructions: "1. Lie back, hands under glutes\n2. Legs straight, slight lift\n3. Alternate small kicks up and down\n4. Keep lower back pressed down\n5. Steady pace",
  },
  {
    name: "Dragon Flag", description: "Advanced core exercise popularized by Bruce Lee. Extreme ab strength.",
    category: "strength", muscle_group: "core", secondary_muscles: '["hip flexors","lats"]', equipment: null, tracking_type: "reps_only",
    instructions: "1. Lie on bench, grip behind head\n2. Raise body until vertical\n3. Lower body as straight as possible\n4. Don't let hips bend\n5. Control the descent",
  },
  {
    name: "Weighted Sit-Up", description: "Classic sit-up with added weight for progressive overload.",
    category: "strength", muscle_group: "core", secondary_muscles: '["hip flexors"]', equipment: "other", tracking_type: "reps_weight",
    instructions: "1. Lie back, hold plate on chest\n2. Feet anchored or free\n3. Sit all the way up\n4. Lower slowly\n5. Keep weight against chest",
  },
  {
    name: "Cable Crunch", description: "Kneeling cable crunch for weighted ab work with constant tension.",
    category: "strength", muscle_group: "core", secondary_muscles: '[]', equipment: "cable", tracking_type: "reps_weight",
    instructions: "1. Kneel facing cable, rope behind head\n2. Crunch down curling torso\n3. Bring elbows toward knees\n4. Squeeze abs at bottom\n5. Return slowly",
  },
  {
    name: "Hollow Body Hold", description: "Gymnastic core position. Builds anti-extension endurance.",
    category: "strength", muscle_group: "core", secondary_muscles: '["hip flexors"]', equipment: null, tracking_type: "duration",
    instructions: "1. Lie flat, arms overhead\n2. Press lower back into floor\n3. Lift arms, shoulders, and legs slightly\n4. Hold banana shape\n5. Don't let lower back arch",
  },
  {
    name: "Woodchop with Dumbbell", description: "Rotational movement with dumbbell for core power.",
    category: "strength", muscle_group: "core", secondary_muscles: '["obliques","shoulders"]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. Hold dumbbell with both hands\n2. Start at one hip\n3. Swing diagonally overhead to other side\n4. Rotate through core\n5. Control the return",
  },

  // ===== CARDIO =====
  {
    name: "Running", description: "Fundamental cardio. Steady-state or intervals for different goals.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["quads","hamstrings","calves","core"]', equipment: null, tracking_type: "duration_distance",
    instructions: "1. 5-minute walking warm-up\n2. Upright posture, slight forward lean\n3. Land midfoot\n4. Arms relaxed at 90 degrees\n5. Breathe rhythmically",
  },
  {
    name: "Cycling", description: "Low-impact cardio building leg endurance. Great for recovery or HIIT.",
    category: "cardio", muscle_group: "legs", secondary_muscles: '["glutes","core"]', equipment: "bike", tracking_type: "duration_distance",
    instructions: "1. Seat height: slight bend at bottom\n2. Core engaged, back neutral\n3. Smooth pedal circles\n4. 80-100 RPM steady state\n5. Adjust resistance for intensity",
  },
  {
    name: "Rowing Machine", description: "Full-body cardio working 86% of muscles. Builds aerobic and anaerobic capacity.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["back","legs","arms","core"]', equipment: "machine", tracking_type: "duration_distance",
    instructions: "1. Strap feet, overhand grip\n2. Start: legs bent, arms extended (catch)\n3. Drive legs, lean back, pull arms\n4. Reverse: arms-body-legs\n5. Maintain rhythm",
  },
  {
    name: "Jump Rope", description: "High-intensity cardio improving coordination and agility. A boxer's staple.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["calves","shoulders","forearms"]', equipment: "jump rope", tracking_type: "reps_duration",
    instructions: "1. Rope handles reach armpits when standing on center\n2. Elbows close to body\n3. Turn with wrists, not arms\n4. Jump just enough to clear\n5. Land softly on balls of feet",
  },
  {
    name: "Burpees", description: "Full-body cardio and strength combo. One of the most demanding bodyweight exercises.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["chest","legs","core","shoulders"]', equipment: null, tracking_type: "reps_only",
    instructions: "1. Squat down, hands on floor\n2. Jump feet back to plank\n3. Perform a push-up\n4. Jump feet forward to hands\n5. Explode into jump with arms overhead",
  },
  {
    name: "Battle Ropes", description: "High-intensity upper body cardio. Builds grip, shoulders, and conditioning.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["shoulders","arms","core"]', equipment: "other", tracking_type: "reps_duration",
    instructions: "1. Athletic stance, hold rope ends\n2. Alternate arms up and down for waves\n3. Core braced, knees slightly bent\n4. Maintain intensity for time\n5. Try slams, circles, snakes",
  },
  {
    name: "Kettlebell Swing", description: "Explosive hip hinge building posterior chain power and cardio fitness.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["glutes","hamstrings","core","shoulders"]', equipment: "kettlebell", tracking_type: "reps_duration",
    instructions: "1. Feet wider than shoulder-width\n2. Hinge, grip kettlebell both hands\n3. Swing between legs\n4. Drive hips forward to chest height\n5. Let gravity return, repeat",
  },
  {
    name: "Box Jump", description: "Plyometric building explosive lower body power. Develops fast-twitch fibers.",
    category: "cardio", muscle_group: "legs", secondary_muscles: '["glutes","core","calves"]', equipment: "other", tracking_type: "reps_only",
    instructions: "1. Face a sturdy box\n2. Swing arms back, load hips\n3. Explode up onto box\n4. Land softly, both feet\n5. Stand up, step down",
  },
  {
    name: "Stair Climber", description: "Low-impact cardio targeting glutes and quads. Great calorie burner.",
    category: "cardio", muscle_group: "legs", secondary_muscles: '["glutes","calves","core"]', equipment: "machine", tracking_type: "duration_distance",
    instructions: "1. Step on, select pace\n2. Stand upright, light grip\n3. Drive through full foot\n4. Don't lean on handles\n5. Steady rhythm",
  },
  // New cardio exercises
  {
    name: "Treadmill Walking", description: "Low-intensity steady-state cardio. Great for warm-up or active recovery.",
    category: "cardio", muscle_group: "legs", secondary_muscles: '["glutes","core"]', equipment: "machine", tracking_type: "duration_distance",
    instructions: "1. Set comfortable walking pace\n2. Light incline for added challenge\n3. Swing arms naturally\n4. Upright posture\n5. Breathe normally",
  },
  {
    name: "Elliptical", description: "Low-impact full-body cardio machine. Easy on joints.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["legs","arms","core"]', equipment: "machine", tracking_type: "duration_distance",
    instructions: "1. Stand on pedals, grip handles\n2. Push and pull arms while striding\n3. Smooth, controlled movement\n4. Adjust resistance as needed\n5. Maintain upright posture",
  },
  {
    name: "Sled Push", description: "Explosive full-body conditioning pushing a weighted sled.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["quads","glutes","core","shoulders"]', equipment: "other", tracking_type: "duration_distance",
    instructions: "1. Grip sled handles, lean forward\n2. Drive through legs to push\n3. Keep arms extended\n4. Short, powerful steps\n5. Push for distance or time",
  },
  {
    name: "Assault Bike", description: "Air resistance bike for brutal full-body intervals. Arms and legs work together.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["arms","legs","core"]', equipment: "bike", tracking_type: "duration_distance",
    instructions: "1. Sit on bike, grip handles\n2. Push and pull arms while pedaling\n3. Increase speed for more resistance\n4. All-out for intervals\n5. Steady pace for endurance",
  },
  {
    name: "Swimming", description: "Full-body low-impact cardio. Works every major muscle group.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["shoulders","back","core","legs"]', equipment: null, tracking_type: "duration_distance",
    instructions: "1. Warm up with easy laps\n2. Choose stroke style\n3. Focus on breathing rhythm\n4. Streamlined body position\n5. Alternate intensities",
  },
  {
    name: "Jumping Jacks", description: "Classic bodyweight cardio. Effective warm-up or HIIT component.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["shoulders","calves"]', equipment: null, tracking_type: "reps_duration",
    instructions: "1. Stand feet together, arms at sides\n2. Jump feet apart, arms overhead\n3. Jump back to start\n4. Land softly\n5. Maintain rhythm",
  },
  {
    name: "High Knees", description: "Dynamic running-in-place cardio drill. Elevates heart rate quickly.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["hip flexors","quads","core"]', equipment: null, tracking_type: "reps_duration",
    instructions: "1. Stand tall, arms at sides\n2. Drive knees up to hip height alternately\n3. Pump arms in running motion\n4. Stay on balls of feet\n5. Quick tempo",
  },
  {
    name: "Ski Erg", description: "Standing pull-down cardio machine mimicking cross-country skiing.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["lats","core","arms"]', equipment: "machine", tracking_type: "duration_distance",
    instructions: "1. Stand facing machine, grip handles\n2. Hinge at hips, pull handles down\n3. Drive through triple extension\n4. Smooth, powerful strokes\n5. Maintain rhythm",
  },
  {
    name: "Sled Pull", description: "Drag a weighted sled for conditioning and posterior chain work.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["hamstrings","glutes","back","core"]', equipment: "other", tracking_type: "duration_distance",
    instructions: "1. Attach strap to sled and harness/hands\n2. Lean forward and walk/run\n3. Drive through heels\n4. Keep core braced\n5. Pull for distance or time",
  },
  {
    name: "Tire Flip", description: "Explosive full-body strength-cardio. Classic strongman exercise.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["legs","back","shoulders","arms"]', equipment: "other", tracking_type: "reps_only",
    instructions: "1. Squat behind tire, hands under edge\n2. Drive through legs to lift\n3. Push tire past tipping point\n4. Push it over with arms\n5. Repeat",
  },

  // ===== FLEXIBILITY =====
  {
    name: "Yoga Flow", description: "Flowing yoga poses improving flexibility, balance, and focus.",
    category: "flexibility", muscle_group: "full body", secondary_muscles: '["core","shoulders","hips"]', equipment: null, tracking_type: "duration",
    instructions: "1. Start in mountain pose, center breathing\n2. Flow through sun salutation\n3. Hold each pose 3-5 breaths\n4. Smooth transitions\n5. End in savasana",
  },
  {
    name: "Dynamic Stretching Routine", description: "Active stretching for warm-up. Prepares muscles and joints.",
    category: "flexibility", muscle_group: "full body", secondary_muscles: '["hips","shoulders","hamstrings"]', equipment: null, tracking_type: "duration",
    instructions: "1. Arm circles forward/backward\n2. Leg swings front-back, side-side\n3. Walking lunges with twist\n4. High knees and butt kicks\n5. Hip circles",
  },
  {
    name: "Foam Rolling Recovery", description: "Self-myofascial release. Reduces soreness, improves mobility.",
    category: "flexibility", muscle_group: "full body", secondary_muscles: '[]', equipment: "other", tracking_type: "duration",
    instructions: "1. Roller under target muscle\n2. Roll slowly back and forth\n3. Pause on tender spots 20-30s\n4. Moderate pressure\n5. 1-2 minutes per muscle",
  },
  {
    name: "Hip Mobility Flow", description: "Targeted hip mobility. Essential for squat depth and back health.",
    category: "flexibility", muscle_group: "legs", secondary_muscles: '["core","lower back"]', equipment: null, tracking_type: "duration",
    instructions: "1. 90/90 hip stretch each side\n2. Pigeon pose each side\n3. Deep squat hold\n4. Hip circles on all fours\n5. Couch stretch for hip flexors",
  },

  // ===== COMPOUND / FULL BODY =====
  {
    name: "Farmer's Walk", description: "Loaded carry for grip, traps, core stability, and total conditioning.",
    category: "strength", muscle_group: "full body", secondary_muscles: '["traps","forearms","core","legs"]', equipment: "dumbbell", tracking_type: "duration_distance",
    instructions: "1. Pick up heavy dumbbells\n2. Stand tall, shoulders back\n3. Walk with controlled steps\n4. Core braced, grip tight\n5. Walk for distance or time",
  },
  {
    name: "Turkish Get-Up", description: "Full-body mobility and stability exercise. Performed with kettlebell overhead.",
    category: "strength", muscle_group: "full body", secondary_muscles: '["shoulders","core","legs","hips"]', equipment: "kettlebell", tracking_type: "reps_weight",
    instructions: "1. Lie down, press weight up with one hand\n2. Roll to elbow, then hand\n3. Bridge hips, sweep leg under\n4. Stand up keeping weight overhead\n5. Reverse to return to floor",
  },
  {
    name: "Clean and Press", description: "Olympic-style compound lifting weight from floor to overhead.",
    category: "strength", muscle_group: "full body", secondary_muscles: '["shoulders","legs","back","core"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Bar on floor, deadlift grip\n2. Pull to hips with explosive hip drive\n3. Catch at shoulders in front rack\n4. Press overhead to lockout\n5. Lower to shoulders, then floor",
  },
  {
    name: "Thruster", description: "Front squat into overhead press. Brutal full-body conditioning movement.",
    category: "strength", muscle_group: "full body", secondary_muscles: '["quads","glutes","shoulders","core"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Bar in front rack position\n2. Full front squat\n3. Drive up explosively\n4. Press bar overhead using momentum\n5. Lower to front rack and squat again",
  },
  {
    name: "Man Maker", description: "Dumbbell complex: renegade row, push-up, clean, press. Ultimate conditioning.",
    category: "strength", muscle_group: "full body", secondary_muscles: '["chest","back","shoulders","legs","core"]', equipment: "dumbbell", tracking_type: "reps_weight",
    instructions: "1. Push-up position on dumbbells\n2. Row each dumbbell\n3. Do a push-up\n4. Jump feet to hands, clean dumbbells\n5. Press overhead, lower, repeat",
  },
  {
    name: "Overhead Squat", description: "Squat with barbell overhead. Extreme mobility and stability demands.",
    category: "strength", muscle_group: "full body", secondary_muscles: '["shoulders","core","legs"]', equipment: "barbell", tracking_type: "reps_weight",
    instructions: "1. Snatch-width grip, bar overhead\n2. Lock arms, active shoulders\n3. Squat to depth maintaining bar overhead\n4. Drive up keeping bar stable\n5. Requires excellent mobility",
  },
  {
    name: "Bear Crawl", description: "Quadruped locomotion for total body coordination and conditioning.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["shoulders","core","quads"]', equipment: null, tracking_type: "duration_distance",
    instructions: "1. Hands and feet on ground, knees hovering\n2. Move opposite hand and foot together\n3. Keep hips low and level\n4. Crawl forward or backward\n5. Maintain core tension",
  },
  {
    name: "Wall Ball", description: "Squat and throw medicine ball at wall target. CrossFit staple.",
    category: "cardio", muscle_group: "full body", secondary_muscles: '["quads","glutes","shoulders","core"]', equipment: "other", tracking_type: "reps_weight",
    instructions: "1. Hold medicine ball at chest\n2. Full squat\n3. Drive up and throw ball at target\n4. Catch on rebound\n5. Immediately squat again",
  },
];
