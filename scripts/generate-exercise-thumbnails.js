#!/usr/bin/env node
/**
 * Generate SVG thumbnails for exercises based on muscle group.
 * Each SVG shows a simplified body outline highlighting the target area.
 * Run: node scripts/generate-exercise-thumbnails.js
 */
const fs = require("fs");
const path = require("path");
const { initDb, getDb, closeDb } = require("../src/config/database");

const OUTPUT_DIR = path.join(__dirname, "../uploads/exercises");

// Base body outline (simplified anatomical figure)
const BODY_BASE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 320" width="200" height="320">
  <defs>
    <style>
      .body { fill: #e8e8e8; stroke: #999; stroke-width: 1.5; }
      .highlight { fill: #ef4444; opacity: 0.7; }
      .secondary { fill: #f97316; opacity: 0.4; }
      .label { font-family: -apple-system, sans-serif; font-size: 11px; fill: #374151; text-anchor: middle; font-weight: 600; }
    </style>
  </defs>
  <!-- Head -->
  <ellipse class="body" cx="100" cy="30" rx="20" ry="24"/>
  <!-- Neck -->
  <rect class="body" x="92" y="52" width="16" height="12"/>
  <!-- Torso -->
  <path class="body" d="M65,64 L135,64 L130,180 L70,180 Z"/>
  <!-- Left arm -->
  <path class="body" d="M65,64 L45,70 L32,130 L28,180 L40,182 L48,135 L55,80"/>
  <!-- Right arm -->
  <path class="body" d="M135,64 L155,70 L168,130 L172,180 L160,182 L152,135 L145,80"/>
  <!-- Left leg -->
  <path class="body" d="M70,180 L65,250 L60,310 L80,312 L82,255 L85,180"/>
  <!-- Right leg -->
  <path class="body" d="M130,180 L135,250 L140,310 L120,312 L118,255 L115,180"/>
HIGHLIGHTS
  <!-- Label -->
  <text class="label" x="100" y="315">LABEL_TEXT</text>
</svg>`;

// Muscle group highlight paths
const MUSCLE_HIGHLIGHTS = {
  chest: {
    primary: `<ellipse class="highlight" cx="88" cy="90" rx="18" ry="16"/>
    <ellipse class="highlight" cx="112" cy="90" rx="18" ry="16"/>`,
    label: "CHEST",
  },
  back: {
    primary: `<rect class="highlight" x="75" y="75" width="50" height="55" rx="8"/>`,
    label: "BACK",
  },
  shoulders: {
    primary: `<ellipse class="highlight" cx="60" cy="68" rx="14" ry="10"/>
    <ellipse class="highlight" cx="140" cy="68" rx="14" ry="10"/>`,
    label: "SHOULDERS",
  },
  legs: {
    primary: `<path class="highlight" d="M70,180 L65,250 L82,255 L85,180 Z"/>
    <path class="highlight" d="M130,180 L135,250 L118,255 L115,180 Z"/>`,
    label: "LEGS",
  },
  arms: {
    primary: `<path class="highlight" d="M45,70 L32,130 L48,135 L55,80 Z"/>
    <path class="highlight" d="M155,70 L168,130 L152,135 L145,80 Z"/>`,
    label: "ARMS",
  },
  core: {
    primary: `<rect class="highlight" x="78" y="120" width="44" height="55" rx="6"/>`,
    label: "CORE",
  },
  "full body": {
    primary: `<path class="highlight" d="M65,64 L135,64 L130,180 L70,180 Z"/>
    <path class="secondary" d="M70,180 L65,250 L82,255 L85,180 Z"/>
    <path class="secondary" d="M130,180 L135,250 L118,255 L115,180 Z"/>
    <path class="secondary" d="M45,70 L32,130 L48,135 L55,80 Z"/>
    <path class="secondary" d="M155,70 L168,130 L152,135 L145,80 Z"/>`,
    label: "FULL BODY",
  },
};

function generateSvg(muscleGroup) {
  const highlights = MUSCLE_HIGHLIGHTS[muscleGroup] || MUSCLE_HIGHLIGHTS["full body"];
  return BODY_BASE
    .replace("HIGHLIGHTS", highlights.primary)
    .replace("LABEL_TEXT", highlights.label);
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  initDb();
  const db = getDb();

  const exercises = db.prepare("SELECT id, name, muscle_group FROM exercises WHERE is_custom = 0").all();
  const updateStmt = db.prepare("UPDATE exercises SET thumbnail_url = ? WHERE id = ?");

  let count = 0;
  db.transaction(() => {
    for (const ex of exercises) {
      const slug = slugify(ex.name);
      const filename = `${slug}.svg`;
      const filepath = path.join(OUTPUT_DIR, filename);
      const svg = generateSvg(ex.muscle_group);

      fs.writeFileSync(filepath, svg);
      const url = `/uploads/exercises/${filename}`;
      updateStmt.run(url, ex.id);
      count++;
    }
  })();

  console.log(`Generated ${count} SVG thumbnails in ${OUTPUT_DIR}`);
  closeDb();
}

main();
