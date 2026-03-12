#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const SKILLS = [
  "insight-plan",
  "insight-devloop",
  "insight-devloopfast",
  "insight-sentinel",
  "insight-shipwright",
  "insight-storm",
  "insight-monkey",
  "insight-edge-case-hunter",
  "insight-ux",
  "insight-retro",
];

const DEFAULT_CONFIG = `## Theme
- setting: pirate

## Monkey
- findings_per_step: 3

## Confidence (devloopfast only)
- threshold: 80
`;

const pkg = require("../package.json");

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function init(args) {
  const cwd = process.cwd();
  const skillsDir = path.join(cwd, ".claude", "skills");
  const loopDir = path.join(cwd, ".insightsLoop");
  const configPath = path.join(loopDir, "config.md");
  const themesDir = path.join(loopDir, "themes");
  const pkgSkillsDir = path.join(__dirname, "..", "skills");
  const pkgThemesDir = path.join(__dirname, "..", "themes");

  // Parse --skills flag
  const skillsFlag = args.find((a) => a.startsWith("--skills="));
  let selectedSkills = SKILLS;
  if (skillsFlag) {
    const requested = skillsFlag.split("=")[1].split(",").map((s) => s.trim());
    selectedSkills = requested.map((s) =>
      s.startsWith("insight-") ? s : `insight-${s}`
    );
    const invalid = selectedSkills.filter((s) => !SKILLS.includes(s));
    if (invalid.length > 0) {
      console.error(`Unknown skills: ${invalid.join(", ")}`);
      console.error(`Available: ${SKILLS.map((s) => s.replace("insight-", "")).join(", ")}`);
      process.exit(1);
    }
  }

  // Copy skills
  let installed = 0;
  for (const skill of selectedSkills) {
    const src = path.join(pkgSkillsDir, skill);
    const dest = path.join(skillsDir, skill);
    if (!fs.existsSync(src)) {
      console.error(`  skip ${skill} (not found in package)`);
      continue;
    }
    copyDirSync(src, dest);
    installed++;
  }
  console.log(`  ${installed} skills → .claude/skills/`);

  // Copy themes
  if (fs.existsSync(pkgThemesDir)) {
    copyDirSync(pkgThemesDir, themesDir);
    const themeCount = fs.readdirSync(pkgThemesDir).filter((f) => f.endsWith(".md")).length;
    console.log(`  ${themeCount} themes → .insightsLoop/themes/`);
  }

  // Create config (don't overwrite existing)
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(loopDir, { recursive: true });
    fs.writeFileSync(configPath, DEFAULT_CONFIG);
    console.log("  config  → .insightsLoop/config.md (theme: pirate)");
  } else {
    console.log("  config  → exists, skipped");
  }

  console.log("");
  console.log("Run /insight-plan to start.");
}

function update() {
  const cwd = process.cwd();
  const skillsDir = path.join(cwd, ".claude", "skills");
  const pkgSkillsDir = path.join(__dirname, "..", "skills");
  const pkgThemesDir = path.join(__dirname, "..", "themes");
  const themesDir = path.join(cwd, ".insightsLoop", "themes");

  if (!fs.existsSync(path.join(cwd, ".claude", "skills"))) {
    console.error("No .claude/skills/ found. Run `insightsloop init` first.");
    process.exit(1);
  }

  // Only update skills that already exist
  let updated = 0;
  for (const skill of SKILLS) {
    const dest = path.join(skillsDir, skill);
    const src = path.join(pkgSkillsDir, skill);
    if (fs.existsSync(dest) && fs.existsSync(src)) {
      copyDirSync(src, dest);
      updated++;
    }
  }
  console.log(`  ${updated} skills updated`);

  // Update themes
  if (fs.existsSync(pkgThemesDir)) {
    copyDirSync(pkgThemesDir, themesDir);
    console.log("  themes updated");
  }

  console.log("  config.md preserved");
}

// CLI routing
const [, , command, ...args] = process.argv;

console.log(`\n  insightsloop v${pkg.version}\n`);

switch (command) {
  case "init":
    init(args);
    break;
  case "update":
    update();
    break;
  case "version":
  case "--version":
  case "-v":
    // version already printed
    break;
  default:
    console.log("Usage:");
    console.log("  npx insightsloop init                    Install all skills + themes + config");
    console.log("  npx insightsloop init --skills=plan,monkey,storm   Install selected skills only");
    console.log("  npx insightsloop update                  Update skills (preserves config)");
    console.log("  npx insightsloop version                 Show version");
    console.log("");
    console.log(`Available skills: ${SKILLS.map((s) => s.replace("insight-", "")).join(", ")}`);
    break;
}
