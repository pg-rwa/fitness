#!/usr/bin/env node
/**
 * Compile all extracted exercise names from screenshots, deduplicate,
 * remove existing exercises, categorize, and generate seed data files.
 */

const fs = require("fs");
const path = require("path");

// All exercises extracted from 222 screenshots across 17 batches
const allExtracted = `
American Kettlebell Swing
Anchored Reverse Crunch
Anchored Straight Leg Raises
Angled Machine Leg Press
Angled Machine Single Leg Press
Angled Machine Sumo Leg Press
Ankle Alphabets
Ankle Dorsiflexion
Ankle Inversion and Eversion
Ankle Plantar and Dorsiflexion
Ankle Plantarflexion
Ape Walk
Arm Circle
Arms Overhead Reverse Lunge to Side Bend
Around the World
Around The World Lunges
Assisted Leg Lowering to Bolster
Away Facing Cable Pulldown
Backward Sled Drag
Balance Board Elbow Side Plank
Balance Board Full Plank
Balance Board Glute Bridge
Balance Board Push Up
Balance Board Side Plank
Balance Board Single Leg Glute Bridge
Balance Board Single Leg Knee Drive
Balance Board Single Leg Standing
Balance Board Single Leg Standing Hold
Balance Board Single Leg Standing with Knee Raise
Balance Board Split Squat
Balance Board Squat
Balance Board Standing Hold
Ball toss
Band Alternating Bicep Curl
Band Alternating Front Raise
Band Alternating Shoulder Press
Band Alternating Tension Lateral Raise
Band Anchored Alternating Bent Over Row
Band Anchored Alternating Decline Chest Press
Band Anchored Alternating Front Raise
Band Anchored Alternating Incline Curl
Band Anchored Alternating Reverse Lunge Row
Band Anchored Alternating Standing Incline Chest Press
Band Anchored Chest Fly
Band Anchored Chest Press
Band Anchored Decline Chest Press
Band Anchored High-Low Woodchop
Band Anchored Incline Curl
Band Anchored Kneeling Tricep Extension
Band Anchored Low-High Woodchop
Band Anchored Overhead Tricep Extension
Band Anchored Pistol Squat to Row
Band Anchored Reverse Fly
Band Anchored Side Lunge
Band Anchored Single Arm Chest Press
Band Anchored Single Arm Front Raise
Band Anchored Single Arm Incline Curl
Band Anchored Single Arm Overhead Tricep Extension
Band Anchored Single Arm Row
Band Anchored Single Arm Standing Incline Press
Band Anchored Single Arm Tricep Kickback
Band Anchored Single Arm Tricep Pushdown
Band Anchored Squat to Row
Band Anchored Standing Incline Chest Press
Band Anchored Tricep Kickback
Band Anchored Tricep Pushdown
Band Assisted Chin Up
Band Assisted Mid Grip Pull Up
Band Assisted Parallel Grip Pull Up
Band Assisted Wide Grip Pull Up
Band Bar Muscle Up
Band Bent Over Row
Band Bicep Curl
Band Calf Raise
Band Deadlift
Band External Shoulder Rotation
Band External Shoulder Rotation (90 degrees)
Band Face Pulls
Band Front To Lateral Raise
Band Glute Kickback
Band Internal Shoulder Rotation
Band Internal Shoulder Rotation (90 degrees)
Band Lat Pull Down
Band Lateral Raise
Band Lunge to Curl
Band Lying Leg Press
Band Overhead Reverse Lunge
Band Overhead Tricep Extension
Band Pallof Press
Band Pallof Press and Raise
Band Plank Row
Band Pull Through
Band Reverse Lunge
Band Shoulder Press
Band Single Arm Bicep Curl
Band Single Arm Decline Chest Press
Band Single Arm Kneeling Overhead Tricep Extension
Band Single Arm Lat Pull Down
Band Single Arm Shoulder Abduction
Band Single Arm Straight Arm Pulldown
Band Single Leg Lying Press
Band Split Squat
Band Standing Hip Adduction
Band Standing Hip Flexion
Band Standing Row
Band Standing Y's
Band Straight Arm Pulldown
Band Tricep Kickback
Band Upright Row
Band-Assisted GHD Hip Extension
Band-Assisted Glute-Ham Raise
Band-Assisted Hanging Leg Raise
Banded Bear Crawl
Banded Lateral Bear Crawl
Banded Sprinter
Banded Thruster
Bar Assisted Chin Ups
Bar Assisted Pull-ups
Bar Assisted Single Leg Support Pull-ups
Bar Hang
Barbell 21
Barbell B Stance Hip Thrust
Barbell Back Squat
Barbell Banded Hip Thrust
Barbell Behind Back Palm Up Wrist Curl
Barbell Behind the Neck Overhead Press
Barbell Bench Press
Barbell Bench Press Wide Grip
Barbell Bent Over Row
Barbell Bicep Curl
Barbell Bulgarian Split Squat
Barbell Clean and Jerk
Barbell Clean and Press
Barbell Clean High Pull
Barbell Close Grip Bench Press
Barbell Close Grip Preacher Curl
Barbell Curtsy Lunge
Barbell Deadlift
Barbell Decline Bench Press
Barbell Decline Bench Press Close Grip
Barbell Decline Bench Press Wide Grip
Barbell Deficit Split Squat
Barbell Floor Glute Bridge
Barbell Forward Lunge
Barbell Front Rack Step Up
Barbell Front Racked Reverse Lunge
Barbell Front Racked Split Squat
Barbell Front Squat
Barbell Full Clean
Barbell Full Snatch
Barbell Good Morning
Barbell Hang Clean And Jerk
Barbell Hang Clean Split Jerk
Barbell Hang Snatch
Barbell High Pull
Barbell Hip Thrust
Barbell Horizontal Seal Row
Barbell Incline Bench Close Grip
Barbell Incline Bench Press
Barbell Incline Bench Pull
Barbell Incline Bench Wide Grip
Barbell Lateral Lunge
Barbell Long Stance Hip Thrust
Barbell Narrow Grip Bicep Curl
Barbell Overhead Press
Barbell Overhead Push Press
Barbell Overhead Squat
Barbell Power Snatch
Barbell Preacher Curl
Barbell RDL
Barbell Rear Delt Row
Barbell Rear Shrug
Barbell Reverse Lunge
Barbell Romanian Deadlift
Barbell Seated Shoulder Press
Barbell Shrug
Barbell Side Bend
Barbell Single Leg Hip Thrust
Barbell Skullcrusher
Barbell Step Up
Barbell Straight Leg Deadlift
Barbell Sumo Deadlift
Barbell Thruster
Barbell Torso Twist
Barbell Upright Row
Barbell Wide Grip Bicep Curl
Barbell Wide Grip Deadlift
Barbell Wide Grip Romanian Deadlift
Battle Rope Alternating Power Slam
Battle Rope Alternating Shoulder Press to Lateral Drop
Battle Rope Alternating Wave
Battle Rope Alternating Wave Get Up
Battle Rope Alternating Wave Reverse Lunge
Battle Rope Alternating Wave Side Shuffle
Battle Rope Alternating Wave Squat
Battle Rope Burpee
Battle Rope Cross Body Wave
Battle Rope Double Wave
Battle Rope High Plank Alternating Slams
Battle Rope In And Out Wave
Battle Rope Inward Circle
Battle Rope Jumping Jack
Battle Rope Outward Circle
Battle Rope Overhead Press to Lateral Drop
Battle Rope Plank Alternating Slams
Battle Rope Power Slam
Battle Rope Russian Twist
Battle Rope Side Slam
Battle Rope Side Slam Alternating Lunge
Battle Rope Sidewinder
Battle Rope Single Arm Elbow Plank Waves
Battle Rope Single Arm Inward Circle
Battle Rope Single Arm Outward Circle
Battle Rope Single Arm Wave
Battle Rope Single Arm Wave Full Plank
Battle Rope Single Leg Snake
Battle Rope Slam Squat Jump
Battle Rope Snake
Battle Rope Star Jump
Battle Rope Thruster
Battle Rope Wave Jump Squat
Bear Crawl
Bear Crawl Bird Dog
Bear Plank
Bear Plank with Shoulder Tap
Bear Position Kettlebell Pull Through
Bear Squat to Downward Dog
Bear Squat to Push-Up
Bear Squat to Spiderman
Bear Squat to Spinal Wave
Bear Stance Single Arm Row
Bear to Stand
Bear to Step Through
Bear to T-Rotation
Bear to Underswitch
Bear Underswitch to Crab Reach
Bear Walk Out to Push-Up
Beat Swings
Bench Alternating Leg Raise
Bench Bridge March
Bench Crunches
Bench Hip Raise to Hip Lift
Bench Hip Thrust
Bench Hopover Burpee
Bench Jumping Step Ups
Bench Knee Tuck to V Up
Bench Leg Raise
Bench Plank Single Arm Row
Bench Plyo Push Ups
Bench Push Up to Mountain Climber
Bench Reverse Crunch
Bench Side Plank Hip Dip
Bench Side Plank Oblique Crunch
Bench Side Plank Row to Press
Bench Single Leg Hip Thrust
Bench Skater Steps
Bench Support Pull Down
Bench Toe Crunches
Bench Tricep Dip
Bench Twist Crunches
Bench Up & Overs
Bench V Sit Leg Raise
Bench V-sits
Bent Knee Inverted Rows
Bent Knee Toes to Bar
Bent Knee Windshield Wiper
Bent Over Medicine Ball High Row
Bicycle Crunch
Bird Dog
Bird Dog Balance Row
Body Weight Alternating Forward Lunge
Body Weight Calf Raise
Body Weight Forward Lunge
Body Weight Reverse Lunge
Body Weight Single Leg Deadlift
Body Weight Squat
Body Weight Step Up
Body Weight Turkish Get Up
Bodyweight Alternating Cossack Squat
Bodyweight Alternating Step Up
Bodyweight Arms Overhead Squat
Bodyweight A-skip
Bodyweight Bear Squat To Plank
Bodyweight Bent Knee Calf Raise
Bodyweight Bent Knee Single Leg Calf Raise
Bodyweight B-skip
Bodyweight Cossack Squat
Bodyweight Crab Reach
Bodyweight Deadbug
Bodyweight Deadlift
Bodyweight Kang Squat
Bodyweight Lateral Squat
Bodyweight Rear Foot Elevated Squat
Bodyweight Reverse Plank
Bodyweight Single Leg Calf Raise
Bodyweight Single Side Step Up
Bodyweight Snap Down
Bodyweight Spiderman Lunge To Rotation
Bodyweight Split Squat
Bodyweight Squat To Hinge
Bodyweight Sumo Squat
Bodyweight Walking Lunge
BOSU Burpee
BOSU Dome Down Push Up
BOSU Dome Down Squat
BOSU Dome Up Crunch
BOSU Dome Up Glute Bridge
BOSU Dome Up Push Up
BOSU Lunge to Balance
BOSU Single Leg Glute Bridge
Box Jump
Box Pistol Squat
Box Squat
Broad Jump
Bulgarian Pulses
Burpee
Burpee Broad Jump
Burpee Pull Ups
Burpee to Tuck Jump
Butt Kickers
Cable Bent Over Row
Cable Bicep Curl
Cable External Rotation
Cable Flat Chest Fly
Cable Front Raise
Cable Glute Crossover Kickback
Cable High Bicep Curl
Cable High-Low Chop
Cable Hip Abduction
Cable Incline Chest Fly
Cable Internal Shoulder Rotation
Cable Iron Cross Pulldown
Cable Kneeling Crunch
Cable Kneeling High-Low Chop
Cable Kneeling Low-High Chop
Cable Kneeling Overhead Tricep Extension
Cable Kneeling Rotational Row
Cable Kneeling Row
Cable Kneeling Single Arm Lat Pulldown
Cable Kneeling Single Leg Donkey Kickback
Cable Lateral Raise
Cable Low to High Alternating Cross Over
Cable Low-High Chop
Cable Lunge and Crunch
Cable Lying Down Bicep Curl
Cable Lying Down Torso Twist
Cable Pallof Press
Cable Pallof Press With Overhead Raise
Cable Pull Through
Cable Pullover
Cable Push Pull
Cable Reverse Curl
Cable Reverse Grip Drag Curl
Cable Reverse Grip Tricep Pulldown
Cable Rope Curl
Cable Rope Face Pull
Cable Rope Hammer Curl
Cable Rope Overhead Tricep Extension
Cable Rope Seated High Row
Cable Rope Skullcrusher
Cable Rope Squat and Row
Cable Rope Tricep Extension
Cable Seated Chest Fly
Cable Seated Close Grip Row
Cable Seated Curl
Cable Seated Lower Chest Fly
Cable Seated Rotational Row
Cable Seated Row
Cable Seated Single Arm Row
Cable Seated Wide Grip Row
Cable Shoulder Press
Cable Shrug
Cable Side Bend
Cable Single Arm Bent Over Reverse Fly
Cable Single Arm Bicep Curl
Cable Single Arm Chest Press
Cable Single Arm Front Raise
Cable Single Arm Kneeling Press
Cable Single Arm Lateral Raise
Cable Single Arm Preacher Curl
Cable Single Arm Rear Delt Fly
Cable Single Arm Reverse Fly
Cable Single Arm Shoulder Press
Cable Single Arm Standing Fly
Cable Single Arm Standing Overhead Tricep Extension
Cable Single Arm Tricep Kickback
Cable Single Arm Tricep Pushdown
Cable Single Leg Hip Abduction
Cable Single Leg Hip Extension
Cable Single Leg Kickback
Cable Split Stance Pallof Press
Cable Standing Clamshell
Cable Standing Close Grip Row
Cable Standing Crossover Chest Fly
Cable Standing High Curl
Cable Standing High To Low Fly
Cable Standing High To Low Row
Cable Standing Horizontal Chest Fly
Cable Standing Knee Drive
Cable Standing Low To High Fly
Cable Standing Rear Delt Crossover
Cable Standing Single Arm Row
Cable Standing Single Arm Wide Grip Row
Cable Standing Single Leg Kickback
Cable Standing Upright Row
Cable Standing Wide Grip Row
Cable Straight Arm Lat Pulldown
Cable Straight Arm Rope Lat Pulldown
Cable Straight Bar Skullcrusher
Cable Straight Bar Tricep Pushdown
Cable Tricep Kickback
Cable Underhand Pulldown
Cable Upper Crossover
Cable Upright Row
Cable V Bar Tricep Pushdown
Cable V-Bar Overhead Tricep Extension
Cable Wrist Curl
Calf Raise Farmer Walk
Cat to Cow
Child's Pose
Chin Up
Clamshell
Clamshell with Hip Thrust
Clamshell with Twist
Clapping Push Up
Close Grip Weighted Pull Up
Cobra
Cossack Squat to T-Spine Reach
Crab Reach
Crab Walk
Cross Body Mountain Climber
Cross Crunch
Crunch Heel Tap
Curtsy Pulse Lunge
Cycling
Dead Bug (Iso Hold)
Deadbug - Arms Only
Deadbug - Legs Only
Decline Bench Sit Up
Decline Mountain Climber
Decline Push Up
Decline Renegade Row
Deficit Reverse Lunge
Diamond Push Up
Dip
Dip Machine Bent Leg Raise
Dip Machine Straight Leg Raise
Dirty Dog
Donkey Kick
Double Kettlebell Clean
Double Kettlebell Clean to Front Squat
Double Kettlebell Push Press
Double Kettlebell Racked Front Squat
Double Kettlebell Squat
Double Kettlebell Swing
Double Under
Downward Dog
Dumbbell 6-Way Shoulder Raise
Dumbbell 90 Degree Lateral Raise
Dumbbell Alternating Bicep Curl
Dumbbell Alternating Chest Press
Dumbbell Alternating Curtsy Lunge
Dumbbell Alternating Floor Press
Dumbbell Alternating Hammer Curl
Dumbbell Alternating Lateral Raise to Front Raise
Dumbbell Alternating Preacher Bicep Curl
Dumbbell Alternating Reverse Lunge
Dumbbell Alternating Reverse Lunge to Shoulder Press
Dumbbell Alternating Shoulder Press
Dumbbell Atlas Press
Dumbbell Bench Press
Dumbbell Bent Over Row
Dumbbell Bent Over Row to Rear Fly
Dumbbell Bent Over Row to Tricep Kickback
Dumbbell Bicep Curl
Dumbbell B-Stance Goblet Squat
Dumbbell Bulgarian Split Squat
Dumbbell Burpee Clean to Press
Dumbbell Calf Raise
Dumbbell Clean and Press
Dumbbell Concentration Curl
Dumbbell Curl to Shoulder Press
Dumbbell Curtsy Lunge to Lateral Raise
Dumbbell Deadlift
Dumbbell Deadlift to Row
Dumbbell Decline Bench Press
Dumbbell Flat Bench Chest Fly
Dumbbell Floor Press
Dumbbell Forward Lunge
Dumbbell Front Raise
Dumbbell Front Squat
Dumbbell Front to Lateral Raise
Dumbbell Glute Bridge
Dumbbell Goblet Squat
Dumbbell Hammer Curl
Dumbbell Hammer Preacher Curl
Dumbbell Hamstring Curl
Dumbbell Hang Power Clean
Dumbbell High Pull
Dumbbell Hip Thrust
Dumbbell Incline Alternating Chest Press
Dumbbell Incline Bench Chest Fly
Dumbbell Incline Bench Press
Dumbbell Incline Bench Row
Dumbbell Incline Bicep Curl
Dumbbell Incline Tricep Press
Dumbbell Iron Cross Raise
Dumbbell Jump Squat to Press
Dumbbell Kickstand Deadlift
Dumbbell Lateral Lunge to Press
Dumbbell Lateral Raise
Dumbbell Lateral Step Up
Dumbbell Lying Tricep Extension
Dumbbell Overhead Standing March
Dumbbell Palm Down Wrist Curl
Dumbbell Palm Up Wrist Curl
Dumbbell Pullover
Dumbbell Push Press
Dumbbell RDL To Rear Delt Fly
Dumbbell Renegade Row
Dumbbell Reverse Lunge
Dumbbell Reverse Lunge to Shoulder Press
Dumbbell Romanian Deadlift
Dumbbell Seated Arnold Press
Dumbbell Seated Back Fly
Dumbbell Seated Front Raise
Dumbbell Seated Overhead Tricep Extension
Dumbbell Seated Shoulder Press
Dumbbell Shoulder Scaptions
Dumbbell Shrug
Dumbbell Side Bend
Dumbbell Single Arm Bicep Curl
Dumbbell Single Arm Clean and Press
Dumbbell Single Arm Floor Press
Dumbbell Single Arm High Pull
Dumbbell Single Arm Lateral Raise
Dumbbell Single Arm Overhead Tricep Extension
Dumbbell Single Arm Preacher Curl
Dumbbell Single Arm Row
Dumbbell Single Arm Shoulder Press
Dumbbell Single Arm Snatch
Dumbbell Single Arm Tricep Kickback
Dumbbell Single Leg Calf Raise
Dumbbell Single Leg Deadlift
Dumbbell Single Leg Deadlift to Row
Dumbbell Skater Squat
Dumbbell Snatch
Dumbbell Split Squat
Dumbbell Squat
Dumbbell Squat Clean and Press
Dumbbell Squat to Press
Dumbbell Standing Back Fly
Dumbbell Standing Shoulder Press
Dumbbell Stationary Lunge
Dumbbell Step Up
Dumbbell Step-Up to Overhead Press
Dumbbell Straight Leg Deadlift
Dumbbell Sumo Deadlift
Dumbbell Sumo Squat
Dumbbell Thruster
Dumbbell Tricep Press
Dumbbell Turkish Get-Up
Dumbbell Upright Row
Dumbbell Walking Lunge
Dumbbell Walking Lunge with Bicep Curl
Dynamic Frog Stretch
Dynamic Hamstring Stretch
Dynamic Hip Flexor Stretch
Dynamic Pigeon Stretch
Eccentric Push Up
Elbow Plank
Elbow Side Plank
Elevated Pike Push-Up
Elliptical
Extended Puppy Pose
EZ Bar Preacher Curl
EZ Bar Upright Row
Farmer Walk
Fast Feet
Feet Elevated Inverted Rows
Fire Hydrant
Flat Bench Back Fly
Floor Glute Kickback
Foam Roller Back
Foam Roller Calf
Foam Roller Chest Opener Stretch
Foam Roller Glute
Foam Roller Hamstring
Foam Roller Hip Flexor
Foam Roller Lat
Foam Roller Lower Back
Foam Roller Quadricep
Foam Roller T-Spine
Foam Roller Upper Back
Forward Fold Stretch
Forward Lunge to Hop Switch
Frog Jump
Full Sit Up
GHD Back Extension
GHD Hip Extension
GHD Sit-Up
Glute Bridge
Glute Bridge Walkout
Glute-Ham Raise
Hack Squat
Half Kneeling Single Arm Shoulder Press
Hanging Leg Raise
Hanging Windshield Wiper
High Knees
High Plank
High Plank Jacks
High Plank Shoulder Taps
Hip Airplane
Hip Extension
Hip Thrust Machine
Hollow Body Hold
Hollow Rock to V-Up
Hyperextension Roman Chair Back Extension
Inchworm Walk
Incline Push Up
Incline Push-Up to Shoulder Tap
Inverted Row
Jump Rope
Jump Squat to Reverse Lunge
Jumping Jack
Jumping Pull Up
Jumping Split Squat
Kettlebell Alternating Bent Over Row
Kettlebell Alternating Clean
Kettlebell Alternating Press
Kettlebell Alternating Reverse Lunge
Kettlebell Arm Bar
Kettlebell Bent Over Row
Kettlebell Bottoms Up Press
Kettlebell Clean and Jerk
Kettlebell Clean and Press
Kettlebell Contralateral Bulgarian Split Squat
Kettlebell Curtsy Lunge
Kettlebell Deadlift to Upright Row
Kettlebell Figure 8
Kettlebell Floor Press
Kettlebell Forward Lunge
Kettlebell Goblet Squat
Kettlebell Half Kneeling Overhead Press
Kettlebell High Pull
Kettlebell Kickstand Deadlift
Kettlebell Lateral Lunge
Kettlebell Lateral Step Up
Kettlebell Overhead Carry
Kettlebell Pass Around The Body
Kettlebell Plank Pull Through
Kettlebell Racked Carry
Kettlebell Racked Forward Lunge
Kettlebell Racked Reverse Lunge
Kettlebell Renegade Row
Kettlebell Reverse Lunge
Kettlebell Romanian Deadlift To Bent Over Row
Kettlebell Single Arm Clean
Kettlebell Single Arm Clean and Press
Kettlebell Single Arm Floor Press
Kettlebell Single Arm High Pull
Kettlebell Single Arm Overhead Squat
Kettlebell Single Arm Row
Kettlebell Single Arm Shoulder Press
Kettlebell Single Arm Snatch
Kettlebell Single Arm Swing
Kettlebell Single Leg Deadlift
Kettlebell Skater Squat
Kettlebell Snatch
Kettlebell Split Squat
Kettlebell Squat to Shoulder Press
Kettlebell Standing Overhead Press
Kettlebell Sumo Deadlift
Kettlebell Swing
Kettlebell T-Rex Swing
Kettlebell Turkish Get Up
Kettlebell Upright Row
Kettlebell Walking Lunges
Kettlebell Windmill
Kick Throughs
Kipping Pull Up
Kipping Toes to Bar
Knee to Elbow Crunch
Kneeling Push Up
Kneeling Shoulder Taps
Lacrosse Ball Calf Release
Lacrosse Ball Glute Release
Lacrosse Ball Hamstring Release
Lacrosse Ball Lat Release
Lacrosse Ball Quad Release
Landmine Alternating Lunges
Landmine Anti-Rotations
Landmine Bent Over Row
Landmine Bulgarian Split Squat
Landmine Clean & Press
Landmine Curtsy Lunges
Landmine Deadlift
Landmine Front Squat
Landmine Glute Bridge
Landmine Good Morning
Landmine Hack Squat
Landmine Half-Kneeling Single Arm Press
Landmine High Pull
Landmine Hip Thrust
Landmine Jump Squat
Landmine Kneeling Shoulder Press
Landmine Lateral Lunge
Landmine Lateral Press
Landmine Lateral Squat
Landmine Lunge to Press
Landmine Offset Squat
Landmine Overhead Squat
Landmine Pistol Squat
Landmine Pivot Press
Landmine Plank Row
Landmine Power Clean
Landmine Press
Landmine Push Press
Landmine RDL
Landmine Rear Delt Fly
Landmine Reverse Lunge
Landmine Rollout
Landmine Romanian Deadlift
Landmine Rotation
Landmine Rotational Press
Landmine Russian Twist
Landmine Shoulder Press
Landmine Side Bend
Landmine Single Arm Bicep Curl
Landmine Single Arm Row
Landmine Single Leg Deadlift
Landmine Snatch
Landmine Split Squat
Landmine Squat to Press
Landmine Standing Pallof Press
Landmine Sumo Deadlift
Landmine Sumo Squat
Landmine Thruster
Lat Machine Parallel Grip Row
Lat Machine Straight Arm Pulldown
Lat Pulldown Machine Wide Grip
Lateral Bear Crawl
Lateral Bounds
Lateral Lunge to Hop
Lateral Lunge to Side Kick
Lateral Sled Drag
Lateral Step-Up to High Knee
Leg Press Machine Calf Raise
Leg Press Machine Single Leg
Leg Raise to Hip Lift
Low Plank Jacks
Lunge to Curtsy
Lying Hip Abductions
Machine Assisted Chin Up
Machine Assisted Dip
Machine Assisted Wide Grip Pull Up
Machine Back Extension
Machine Bicep Curl
Machine Glute Kickback
Machine Incline Chest Press
Machine Lateral Raise
Machine Lying Leg Curl
Machine Lying Single Leg Curl
Machine Preacher Curl
Machine Seated Abduction
Machine Seated Calf Raise
Machine Seated Chest Fly
Machine Seated Chest Press
Machine Seated Dip
Machine Seated Hip Adduction
Machine Seated Leg Curl
Machine Seated Leg Extension
Machine Seated Neutral Grip Row
Machine Seated Parallel Grip Chest Press
Machine Seated Parallel Grip Shoulder Press
Machine Seated Reverse Fly
Machine Seated Shoulder Press
Machine Seated Single Arm Bicep Row
Machine Seated Single Arm Chest Fly
Machine Seated Single Arm Shoulder Press
Machine Seated Single Leg Curl
Machine Seated Supinated Grip Row
Machine Single Leg Extension
Machine Standing Calf Raise
Machine Standing Single Leg Curl
Machine Sumo Leg Press
Machine Tricep Pushdowns
Marching Glute Bridge
Medicine Ball Flutter Kicks
Medicine Ball Half Kneel Wood Chop
Medicine Ball Hollow Hold Press
Medicine Ball Knee Drives
Medicine Ball Kneeling Slam
Medicine Ball Lunge
Medicine Ball Mountain Climbers
Medicine Ball Oblique Slam
Medicine Ball Overhead Lunge
Medicine Ball Pass Crunches
Medicine Ball Pike Push Up
Medicine Ball Plank Roll Outs
Medicine Ball Push Up
Medicine Ball Reverse Lunge
Medicine Ball Russian Twist
Medicine Ball Sit-Up To Press
Medicine Ball Slam
Medicine Ball Squat & Press
Medicine Ball Staggered Push Up
Medicine Ball V-up
Mini Band Alternating Side Steps
Mini Band Bear Crawl (Around Legs)
Mini Band Bicycle Crunch
Mini Band Burpee
Mini Band Clamshell
Mini Band Donkey Kicks
Mini Band External Rotation
Mini Band Fire Hydrants
Mini Band Frog Pumps
Mini Band Glute Bridge
Mini Band Glute Kickback
Mini Band Jumping Jack
Mini Band Lateral Squat Walk (Knees)
Mini Band Mountain Climbers
Mini Band Pistol Squat
Mini Band Plank Alternating Leg Lift
Mini Band Pop Squat
Mini Band Pull Aparts
Mini Band Side Lying Hip Abduction
Mini Band Side Steps
Mini Band Single Leg Deadlift
Mini Band Single Leg Glute Bridge
Mini Band Skaters
Mini Band Squat
Mini Band Squat Jumps
Mini Band Standing Hip Abduction
Mini Band Wall Sit
Mountain Climber
Narrow Grip Lat Pulldown
Nordic Curls (Eccentric Only)
Oblique Crunch
Oblique Mountain Climbers
Pallof Press
Parallel Grip Lat Pulldown
Parallel Grip Pull Up
Pike Push Up to Reach
Pistol Squat
Plank Alternating Arm Reach
Plank Alternating Leg Lift
Plank Hip Twist
Plank Pull-Through
Plank To Push Up
Plate Hip Thrust
Plate Russian Twist
Plate Weighted Dip
Plyometric Push Up
Pop Squats
Prisoner Squat
Prone Back Extension T's
Prone Scorpion
Pull Up
Push Up
Push Up to Down Dog
Push Up to T-rotation
Quadruped Hip Circles
Quadruped Hold with Opposite Arm and Leg Reach
Quadruped Scapular Push Up
Rear Foot Elevated Split Jump on Bench
Renegade Push Up Row
Reverse Crunch
Reverse Lunge
Reverse Lunge to Front Kick
Reverse Lunge to Jumping Knee Drive
Reverse Lunge to Rotation
Ring Dips
Ring Muscle Ups
Rope Climb
Rotating Side Plank
Rowing Machine
Running
Running in Place
Russian Twist
Sandbag Bent Over Row
Sandbag Deadlift
Sandbag Front Squat
Sandbag Good Morning
Sandbag Overhead Shoulder Press
Sandbag Reverse Lunge
Sandbag Squat to Press
Sandbag Thrusters
Scapular Pull Up
Scapular Pushups
Seated Dumbbell Curl to Press
Seated Dumbbell Row to Rear Delt Fly
Seated Leg Press
Seated Machine Ab Crunch
Seated Reverse Fly
Shoulder Tap
Shuttle Run
Side Crunch
Side Lunge
Side Lying Thoracic Rotation
Side Plank
Side Plank Cable Row
Side Plank Hip Dip
Side Plank with Abduction
Side Plank with Rear Fly
Single Arm Cable Row
Single Arm Lat Pulldown
Single Arm Reverse Grip Tricep Pulldown
Single Arm Tricep Pushdown
Single Leg Balance
Single Leg Glute Bridge
Single Leg RDL Reach to Hop
Single Leg Skater Squat
Sit To Squat Jump
Skater
Ski Erg
Ski Jumpers
Sled Pull
Sled Pull Through
Sled Push
Sled Row
Sled Squat and Row
Slider Hamstring Curl
Slider Lateral Lunge
Slider Lunge
Slider Mountain Climbers
Slider Pike
Slider Single Leg Hamstring Curl
Slow Mountain Climbers
Smith Machine Back Squat
Smith Machine Behind the Neck Shoulder Press
Smith Machine Bench Press
Smith Machine Bent Over Row
Smith Machine Bulgarian Split Squats
Smith Machine Calf Raise
Smith Machine Close Grip Bench Press
Smith Machine Deadlift
Smith Machine Decline Bench Press
Smith Machine Dips
Smith Machine Front Squat
Smith Machine Glute Bridge
Smith Machine Hanging Leg Raise
Smith Machine Incline Bench Press
Smith Machine Jump Squats
Smith Machine Reverse Lunge
Smith Machine Seated Shoulder Press
Smith Machine Shrug
Smith Machine Single Arm Bench Press
Smith Machine Single Arm Bent Over Row
Smith Machine Single Leg Calf Raise
Smith Machine Split Squats
Smith Machine Sumo Deadlift
Smith Machine Tricep Dip
Smith Machine Upright Row
Spiderman Push Up
Split Squat Pulse
Sprint
Squat Jump
Squat Pulse
Squat to Calf Raise
Squat to T-Rotation
Stability Ball Back Extension
Stability Ball Chest Press
Stability Ball Crunch
Stability Ball Dead Bug
Stability Ball Glute Bridge
Stability Ball Hamstring Curl with Glute Bridge
Stability Ball Jack Knife
Stability Ball Pike
Stability Ball Plank
Stability Ball Push Up
Stability Ball Roll Out
Stability Ball Russian Twist
Stability Ball Stir The Pot
Stability Ball Tuck
Stair Climbing
Standing Calf Raise Pulses
Standing Hamstring Curl
Standing Oblique Crunch
Static Hamstring Stretch
Static Hip Flexor Stretch
Static Pigeon Stretch
Static Quadricep Stretch
Step-Up to Reverse Lunge
Strict Toes to Bar
Sumo Squat to Calf Raise
SuperBand Anchored Decline Chest Press
SuperBand Anchored Squat to Row
SuperBand Anchored Tricep Pushdown
SuperBand Broad Jump
Superband Chest Fly
SuperBand Deadlift
SuperBand Face Pulls
SuperBand Glute Bridge
SuperBand Glute Kickback
Superband Good Morning
SuperBand Kneeling Hip Thrust
SuperBand Lat Pull Down
Superband Lateral Squat Walk
SuperBand Mountain Climber
SuperBand Overhead Reverse Lunge
SuperBand Overhead Squat
SuperBand Overhead Tricep Extension
SuperBand Pallof Press
SuperBand Plank Row
Superband Pull Apart
SuperBand Pull Through
SuperBand Push Up
SuperBand Reverse Lunge and Press
SuperBand Seated Face Pull
SuperBand Seated Row
Superband Shoulder Press
Superband Side Lunge
SuperBand Single Arm Lat Pull Down
SuperBand Single Arm Row
SuperBand Single Leg Glute Bridge
Superband Squat
SuperBand Standing Row
SuperBand Thruster
SuperBand Upright Row
Superman
Superman Lat Pull
Superman Push Up
Suspension Alternating Reverse Lunge
Suspension Atomic Push Up
Suspension Bicep Curl
Suspension Chest Fly
Suspension Chest Press
Suspension Crunch From Hand
Suspension Hamstring Curl
Suspension High Row
Suspension Hip Press
Suspension Knee Tuck
Suspension Low Row
Suspension Mid Row
Suspension Mountain Climber
Suspension Overhead Squat
Suspension Pike
Suspension Power Pull
Suspension Push Up
Suspension Reverse Lunge
Suspension Single Arm Bicep Curl
Suspension Single Arm Row
Suspension Single Leg Squat
Suspension Split Squat
Suspension Squat
Suspension T Delt Fly
Suspension Tricep Extension
Suspension Y Delt Fly
Swimmers
T Push Up
T-Bar Row
Toe Tap
Trap Bar Deadlift
Tuck Jump to Push Up
Underhand Grip Lat Pulldown
Upper Back Row Machine
V Raise
V Up
Walk out to Push Up
Walking
Walking Lunge with Knee Drive
Walking Lunges with Rotation
Wall Sit
Weighted Chin Up
Weighted Full Sit Up
Weighted Push-Up
Weighted Wall Sit
Wide Grip Lat Pulldown
Wide Grip Pull Up
Zottman Curl
Yoga - Boat Pose (Navasana)
Yoga - Bow Pose (Dhanurasana)
Yoga - Bridge Pose (Setu Bandhasana)
Yoga - Camel Pose (Ustrasana)
Yoga - Cat-Cow Stretch
Yoga - Chair Pose (Utkatasana)
Yoga - Child's Pose (Balasana)
Yoga - Cobra Pose (Bhujangasana)
Yoga - Crescent Lunge (Anjaneyasana)
Yoga - Crow Pose (Bakasana)
Yoga - Dancer's Pose (Natarajasana)
Yoga - Dolphin Plank
Yoga - Downward-Facing Dog
Yoga - Eagle Pose (Garudasana)
Yoga - Extended Side Angle Pose
Yoga - Forearm Stand
Yoga - Frog Pose (Mandukasana)
Yoga - Full Split
Yoga - Garland Pose (Malasana)
Yoga - Half Moon Pose
Yoga - Half Split
Yoga - Happy Baby Pose
Yoga - Hero Pose (Virasana)
Yoga - King Pigeon Pose
Yoga - Lizard Pose
Yoga - Locust Pose
Yoga - Lotus Pose (Padmasana)
Yoga - Low Boat Pose
Yoga - Mountain Pose (Tadasana)
Yoga - Pigeon Pose (Kapotasana)
Yoga - Plow Pose (Halasana)
Yoga - Puppy Pose
Yoga - Reverse Warrior
Yoga - Seated Forward Bend
Yoga - Shoulder Stand
Yoga - Side Crow Pose
Yoga - Sphinx Pose
Yoga - Standing Forward Fold
Yoga - Standing Splits
Yoga - Sun Salutation A
Yoga - Sun Salutation B
Yoga - Supine Twist
Yoga - Tree Pose (Vrksasana)
Yoga - Triangle Pose (Trikonasana)
Yoga - Upward-Facing Dog
Yoga - Warrior I
Yoga - Warrior II
Yoga - Warrior III
Yoga - Wheel Pose (Chakrasana)
Yoga - Wide-Legged Forward Fold
Yoga - Wild Thing
Pilates - The Hundred
Pilates - Roll-Up
Pilates - Rolling Like a Ball
Pilates - Single Leg Stretch
Pilates - Double Leg Stretch
Pilates - Scissors
Pilates - Teaser I
Pilates - Teaser II
Pilates - Teaser III
Pilates - Saw
Pilates - Swimming
Pilates - Swan
Pilates - Side Kick Series (Front/Back)
Pilates - Side Kick Series (Up/Down)
Pilates - Spine Stretch Forward
Pilates - Spine Twist
Pilates - Seal
Pilates - Shoulder Bridge
Pilates - Push-Ups (Pilates Style)
Pilates - Plank to Pike
Pilates - Standing Roll-Down
`.trim().split("\n").map(s => s.trim()).filter(Boolean);

// Existing exercise names (lowercase for matching)
const existingExercises = [
  ...require("../prisma/data/exercises-chest"),
  ...require("../prisma/data/exercises-back"),
  ...require("../prisma/data/exercises-shoulders"),
  ...require("../prisma/data/exercises-legs"),
  ...require("../prisma/data/exercises-arms"),
  ...require("../prisma/data/exercises-core-cardio"),
];
const existingNames = new Set(existingExercises.map(e => e.name.toLowerCase().trim()));

// Deduplicate extracted (case-insensitive)
const seen = new Set();
const unique = [];
for (const name of allExtracted) {
  const key = name.toLowerCase().trim();
  if (!seen.has(key) && !existingNames.has(key)) {
    seen.add(key);
    unique.push(name);
  }
}

console.log(`Total extracted: ${allExtracted.length}`);
console.log(`Unique (deduped): ${seen.size + existingNames.size}`);
console.log(`Already in database: ${existingNames.size}`);
console.log(`NEW exercises to add: ${unique.length}`);

// Categorize by muscle group using keyword analysis
function categorize(name) {
  const n = name.toLowerCase();

  // Yoga & Pilates
  if (n.startsWith("yoga")) return { category: "flexibility", muscle_group: "full body", equipment: null, tracking_type: "duration" };
  if (n.startsWith("pilates")) return { category: "flexibility", muscle_group: "core", equipment: null, tracking_type: "duration" };

  // Foam roller / Lacrosse ball / Stretches
  if (n.includes("foam roller") || n.includes("lacrosse ball") || n.includes("stretch") || n.includes("child's pose") || n.includes("cobra") || n.includes("puppy pose") || n.includes("cat to cow") || n.includes("forward fold"))
    return { category: "flexibility", muscle_group: "full body", equipment: "other", tracking_type: "duration" };

  // Battle ropes
  if (n.includes("battle rope")) return { category: "cardio", muscle_group: "full body", equipment: "other", tracking_type: "reps_duration" };

  // Running, sprints, shuttle, stair
  if (n === "running" || n === "sprint" || n === "strides" || n.includes("shuttle run") || n.includes("stair climbing") || n === "walking" || n.includes("running in place") || n.includes("jog"))
    return { category: "cardio", muscle_group: "full body", equipment: null, tracking_type: "duration_distance" };

  // Cardio machines
  if (n === "elliptical" || n.includes("ski erg") || n.includes("rowing machine") || n === "cycling" || n.includes("rower"))
    return { category: "cardio", muscle_group: "full body", equipment: "machine", tracking_type: "duration_distance" };

  // Plyometrics / cardio bodyweight
  if (n.includes("burpee") || n.includes("jump squat") || n.includes("box jump") || n.includes("broad jump") || n.includes("jumping jack") || n.includes("tuck jump") || n.includes("double under") || n.includes("jump rope") || n.includes("high knees") || n.includes("fast feet") || n.includes("butt kickers") || n.includes("skater") || n.includes("pop squat") || n.includes("lateral bound") || n.includes("ski jumper"))
    return { category: "cardio", muscle_group: "full body", equipment: null, tracking_type: "reps_only" };

  // Sled work
  if (n.includes("sled")) return { category: "cardio", muscle_group: "full body", equipment: "other", tracking_type: "duration_distance" };

  // Determine equipment
  let equipment = null;
  if (n.includes("barbell") || n.includes("ez bar")) equipment = "barbell";
  else if (n.includes("dumbbell") || n.includes("db ")) equipment = "dumbbell";
  else if (n.includes("kettlebell") || n.includes("kb ")) equipment = "kettlebell";
  else if (n.includes("cable") || n.includes("pulldown") || n.includes("lat pull")) equipment = "cable";
  else if (n.includes("machine") || n.includes("smith machine") || n.includes("hack squat") || n.includes("leg press") || n.includes("hip thrust machine") || n.includes("upper back row")) equipment = "machine";
  else if (n.includes("band") || n.includes("superband") || n.includes("mini band")) equipment = "band";
  else if (n.includes("suspension") || n.includes("ring")) equipment = "suspension";
  else if (n.includes("medicine ball") || n.includes("med ball")) equipment = "other";
  else if (n.includes("stability ball") || n.includes("bosu")) equipment = "other";
  else if (n.includes("sandbag")) equipment = "other";
  else if (n.includes("slider")) equipment = "other";
  else if (n.includes("balance board")) equipment = "other";
  else if (n.includes("trap bar")) equipment = "barbell";
  else if (n.includes("t-bar")) equipment = "barbell";
  else if (n.includes("landmine")) equipment = "barbell";

  // Determine muscle group
  let muscle_group = "full body";
  if (n.includes("bench press") || n.includes("chest press") || n.includes("chest fly") || n.includes("push up") || n.includes("push-up") || n.includes("pushup") || n.includes("dip") && !n.includes("hip dip"))
    muscle_group = "chest";
  else if (n.includes("row") || n.includes("pull up") || n.includes("pull-up") || n.includes("pullup") || n.includes("chin up") || n.includes("lat pull") || n.includes("pulldown") || n.includes("pullover") || n.includes("back extension") || n.includes("inverted") || n.includes("seal row") || n.includes("face pull") || n.includes("rear delt"))
    muscle_group = "back";
  else if (n.includes("shoulder press") || n.includes("lateral raise") || n.includes("front raise") || n.includes("arnold") || n.includes("overhead press") || n.includes("shrug") || n.includes("upright row") || n.includes("delt fly") || n.includes("shoulder rotation") || n.includes("scaption") || n.includes("iron cross") || n.includes("y raise") || n.includes("t raise") || n.includes("v raise"))
    muscle_group = "shoulders";
  else if (n.includes("squat") || n.includes("lunge") || n.includes("deadlift") || n.includes("rdl") || n.includes("leg press") || n.includes("leg curl") || n.includes("leg extension") || n.includes("hip thrust") || n.includes("glute") || n.includes("calf raise") || n.includes("hamstring") || n.includes("step up") || n.includes("step-up") || n.includes("pistol") || n.includes("good morning") || n.includes("adduct") || n.includes("abduct") && !n.includes("shoulder") || n.includes("nordic") || n.includes("hip extension") || n.includes("split squat") || n.includes("curtsy"))
    muscle_group = "legs";
  else if (n.includes("curl") || n.includes("tricep") || n.includes("skull") || n.includes("kickback") || n.includes("wrist") || n.includes("forearm"))
    muscle_group = "arms";
  else if (n.includes("crunch") || n.includes("plank") || n.includes("sit up") || n.includes("sit-up") || n.includes("v up") || n.includes("v-up") || n.includes("russian twist") || n.includes("woodchop") || n.includes("pallof") || n.includes("dead bug") || n.includes("deadbug") || n.includes("leg raise") || n.includes("flutter") || n.includes("hollow") || n.includes("oblique") || n.includes("mountain climber") || n.includes("toe touch") || n.includes("rotation") || n.includes("side bend") || n.includes("dragon flag") || n.includes("superman") || n.includes("bird dog") || n.includes("windshield"))
    muscle_group = "core";

  // Tracking type
  let tracking_type = "reps_weight";
  if (!equipment || equipment === "other" && !n.includes("medicine ball") && !n.includes("sandbag") && !n.includes("plate")) {
    if (n.includes("hold") || n.includes("plank") || n.includes("stretch") || n.includes("pose") || n.includes("hang") || n.includes("isometric"))
      tracking_type = "duration";
    else
      tracking_type = "reps_only";
  }
  if (n.includes("walk") && (n.includes("farmer") || n.includes("carry") || n.includes("overhead"))) tracking_type = "duration_distance";

  return { category: "strength", muscle_group, equipment, tracking_type };
}

// Generate entries
const entries = unique.map(name => {
  const cat = categorize(name);
  return {
    name,
    description: `${name} exercise.`,
    ...cat,
    secondary_muscles: "[]",
    instructions: "",
  };
});

// Save as JSON for the seed file generator
fs.writeFileSync("/tmp/new_exercises.json", JSON.stringify(entries, null, 2));
console.log(`\nSaved ${entries.length} new exercises to /tmp/new_exercises.json`);

// Print breakdown
const groups = {};
for (const e of entries) {
  groups[e.muscle_group] = (groups[e.muscle_group] || 0) + 1;
}
console.log("\nBreakdown by muscle group:");
for (const [g, c] of Object.entries(groups).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${g}: ${c}`);
}
