#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

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

const THEMES = ["pirate", "space", "naval", "none"];

const pkg = require("../package.json");

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

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

async function init(args) {
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

  // Create insight-config (don't overwrite existing)
  if (!fs.existsSync(configPath)) {
    const themeFlag = args.find((a) => a.startsWith("--theme="));
    let theme = "pirate";

    if (themeFlag) {
      const requested = themeFlag.split("=")[1].trim().toLowerCase();
      if (THEMES.includes(requested)) {
        theme = requested;
      } else {
        console.error(`  Unknown theme: ${requested}. Available: ${THEMES.join(", ")}`);
        process.exit(1);
      }
    } else {
      console.log("\n  Available themes:");
      console.log("    1. pirate  — salt, timber, articles of agreement");
      console.log("    2. space   — vacuum, conduits, mission protocols");
      console.log("    3. naval   — discipline, welds, rules of engagement");
      console.log("    4. none    — no roleplay, default mechanics only\n");

      const answer = await ask("  Choose a theme [1-4, default: 1]: ");
      if (answer === "2" || answer === "space") theme = "space";
      else if (answer === "3" || answer === "naval") theme = "naval";
      else if (answer === "4" || answer === "none") theme = "none";
    }

    const config = DEFAULT_CONFIG.replace("- setting: pirate", `- setting: ${theme}`);
    fs.mkdirSync(loopDir, { recursive: true });
    fs.writeFileSync(configPath, config);
    console.log(`  insight-config → .insightsLoop/config.md (theme: ${theme})`);
  } else {
    console.log("  insight-config → exists, skipped");
  }

  // Copy VALUES.md and TDD-MATRIX.md (don't overwrite existing)
  const pkgRoot = path.join(__dirname, "..");
  const defaults = ["VALUES.md", "TDD-MATRIX.md"];
  for (const file of defaults) {
    const src = path.join(pkgRoot, file);
    const dest = path.join(cwd, file);
    if (!fs.existsSync(src)) continue;
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      console.log(`  ${file} → project root`);
    } else {
      console.log(`  ${file} → exists, skipped`);
    }
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

  console.log("  insight-config preserved");
  console.log("  VALUES.md, TDD-MATRIX.md preserved");
}

// CLI routing
const [, , command, ...args] = process.argv;

console.log(`\n  insightsloop v${pkg.version}\n`);

switch (command) {
  case "init":
    init(args).catch((e) => { console.error(e); process.exit(1); });
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
    console.log("  npx insightsloop init                              Install all skills + themes + config");
    console.log("  npx insightsloop init --skills=plan,monkey,storm   Install selected skills only");
    console.log("  npx insightsloop init --theme=space                Skip theme prompt, use specified theme");
    console.log("  npx insightsloop update                  Update skills (preserves config)");
    console.log("  npx insightsloop version                 Show version");
    console.log("");
    console.log(`Available skills: ${SKILLS.map((s) => s.replace("insight-", "")).join(", ")}`);
    break;
}
