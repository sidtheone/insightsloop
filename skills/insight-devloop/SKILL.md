---
name: insight-devloop
description: "4-step build loop for human+AI teams. Consumes plan.md (with Challenge section) from /insight-plan, then executes: Frame (triage) → Build (TDD + parallel worktrees) → Ship (merge + normalize + verify). Use after /plan produces artifacts, or for any scoped task ready to build. Trigger on: 'build this', 'execute the plan', 'run devloop', 'start building', or when plan.md exists and user wants to proceed."
model: opus
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx jest*), Bash(npx tsc*), Bash(git *), Agent, Skill(insight-edge-case-hunter), Skill(frontend-design), AskUserQuestion
argument-hint: "[path-to-plan.md]"
---

# DevLoop — The Crew

A 4-step build loop that takes plan artifacts and ships verified code. Each step has a crew member responsible for it. Each step produces an artifact consumed by the next.

## The Crew

| Role | Persona | Model | Output |
|------|---------|-------|--------|
| TDD | **The Sentinel** | Opus | Failing test suite |
| Builder | **The Shipwright** | Sonnet | Passing implementation in worktree |
| Adversarial + Consistency | **The Storm** | Opus | `storm-report.md` (issues + consistency) |
| Edge Cases | **The Cartographer** | Sonnet | `edge-cases.md` |
| Chaos | **The Monkey** | Opus | `monkey-[step].md` per step |
| Retro | **The Lookout** | Sonnet | Crew round + learnings (separate skill) |

## Step 0: Load Project Values

Before anything else, check the repo root for `VALUES.md` and `TDD-MATRIX.md`. If they exist, read them. You will paste the relevant content into every agent brief so they actually receive it — not just a vague instruction to "follow values." If they don't exist, omit values-related lines from agent briefs. Do not invent values.

How to brief agents with values:
- Sentinel: paste TDD-MATRIX.md content + key values (YAGNI, simplicity, no over-engineering)
- Shipwright: paste key values (YAGNI, simplicity, "best code is no code", no gold-plating)
- Storm: paste values so she can check the code against them (she also handles consistency — no separate Editor step)
- Monkey: she reads VALUES.md herself — values are her weapons

**Crew SKILL.md files** define each crew member's stable identity, method, and rules. Read each crew member's SKILL.md **right before briefing that crew member** — not all upfront. This keeps context fresh and avoids loading instructions you won't need for several steps:
- `.claude/skills/insight-sentinel/SKILL.md` — read before Step 2a
- `.claude/skills/insight-shipwright/SKILL.md` — read before Step 2b
- `.claude/skills/insight-storm/SKILL.md` — read before Step 3b

### Brief Construction Rules

Three rules govern all crew invocations:

1. **Paste SKILL.md verbatim.** The entire file content — not selected sections, not paraphrased. The SKILL.md is the single source of truth for how each crew member operates.

2. **Write context to a brief file.** Instead of inline brief construction, write run-specific context to `.insightsLoop/current/brief-<crew>.md` (or `brief-<crew>-<mode>.md` for multi-mode crew) and add one line to the Agent prompt: "Read `.insightsLoop/current/brief-<crew>.md` for your mission context." This keeps the Agent prompt short (SKILL.md + one read instruction) and the context complete + inspectable.

3. **Present crew output as-is.** When an Agent returns, show its output directly. Do not rewrite, narrate, or summarize in the orchestrator's own voice. The crew speaks for themselves.

**Brief naming convention:**
- Single-invocation crew: `brief-sentinel.md`, `brief-shipwright.md`, `brief-cartographer.md`
- Multi-mode crew: `brief-storm-verify.md`, `brief-storm-fixspec.md`
- Monkey: `brief-monkey.md` — overwritten each step (the template already structures per-step context)
- All `brief-*.md` files are on the archive **discard list** (ephemeral context, not artifacts)

Also read `.insightsLoop/config.md` for engine tunables if it exists. If it doesn't exist, use these defaults:
- `monkey_findings_per_step` (default: 1) — how many findings the Monkey produces at each step. If > 1, tell the Monkey: "Produce N findings, each using a different technique. Each finding gets its own Technique/Target/Confidence/Survived block in the output file."
- `confidence_threshold` — used by devloopfast only (default: 80)
- `theme` (default: none) — immersive crew theme. See below.

**When constructing Monkey briefs:** If `monkey_findings_per_step` > 1, replace "Pick one technique and apply it with specificity" in each Monkey brief with: "Produce {N} findings, each using a different technique. Each finding gets its own Technique/Target/Confidence/Survived block in the output file." The templates below assume the default (1). Modify them based on config.

### Theme Loading

If `config.md` has `setting:` under `## Theme` and it's not `none`, load `.insightsLoop/themes/{setting}.md`. This file defines:

1. **Persona Openers** — prepend the themed opener to each persona's brief, before their SKILL.md content. The opener sets the scene; the SKILL.md personality takes over after.
2. **Step Names** — use themed step names in status messages and artifact headers (e.g., "Frame" → "Chart Course" for pirate theme).
3. **Orchestrator Voice** — use themed status messages between steps instead of plain status updates. Print these as regular text output so the user sees them.
4. **Artifact Headers** — use themed headers when writing artifact files (e.g., "# Storm Report" → "# Hull Inspection Log").
5. **Vocabulary** — substitute themed terms in orchestrator messages and artifact prose. Never substitute in: file paths, technique names, severity levels, confidence scores, or rule text.

If the theme file doesn't exist, fall back to `none` (no theme) and warn the user.

**Theme does NOT change:** file paths, Monkey technique names, severity levels (critical/high/medium/low), confidence scores, SKILL.md rules or methods, user gate behavior, or any functional logic. Theme is voice and setting only.

## Artifact Directory

All build artifacts go in `.insightsLoop/current/` during the active run. Create it if it doesn't exist.

```
.insightsLoop/
├── current/                  ← active run (working directory)
│   ├── plan.md
│   ├── frame.md
│   ├── monkey-frame.md
│   ├── monkey-tdd.md
│   ├── monkey-build.md
│   ├── monkey-ship.md
│   ├── storm-report.md
│   └── edge-cases.md
├── run-0001-embed-widget/    ← completed run (archived)
│   ├── summary.md
│   ├── plan.md
│   ├── monkey-frame.md
│   ├── monkey-tdd.md
│   ├── monkey-build.md
│   ├── monkey-ship.md
│   └── storm-report.md
└── run-0002-auth-refresh/
    └── ...
```

**Starting a run:** If `.insightsLoop/current/` already has files, warn the user — a previous run wasn't archived. Ask whether to archive it first or discard it.

**Completing a run:** Step 4 (Done) writes `summary.md`, keeps the minimum archive set, discards operational artifacts, and renames `current/` to `run-NNNN-feature-name/`.

**Run naming:** `run-NNNN-feature-name` where NNNN is zero-padded sequential (look at existing `run-*` directories to determine the next number), and feature-name is derived from plan.md's `# Plan: [Feature Name]` heading, lowercased and hyphenated.

## What to Keep (Archive)

These survive into the numbered run directory:
- `plan.md` — intent. Without this, the rest means nothing.
- `monkey-*.md` — her performance over time is how you tune the system.
- `storm-report.md` — real issues found.
- `storm-plan.md` — Storm's plan review findings (if exists).
- `findings-consolidated.md` — unified view of all findings with final status.
- `fix-specs.md` — fix contracts (if fix pipeline ran).
- `scaffolding-checklist.md` — greenfield scaffolding contract (if greenfield).
- `summary.md` — the manifest of what happened.
- `mockup.html` — the Helmsman's approved visual design (if it exists). Useful for retro comparison.

## What to Discard

These are deleted when `current/` becomes `run-NNNN/`:
- `frame.md` — operational, triage is captured in summary.md.
- `edge-cases.md` — either fixed or covered by findings-consolidated.md.
- `brief-*.md` — ephemeral orchestrator context, not artifacts.

## Prerequisites

This skill expects `plan.md` with a `## Challenge` section. Search order: `$ARGUMENTS` (if provided) → `.insightsLoop/current/plan.md` → `plan.md` in repo root. If plan.md doesn't exist, **do not proceed** — tell the user to run `/insight-plan` first. If plan.md exists but has no `## Challenge` section, **do not proceed** — tell the user the plan is incomplete. Both are hard gates — the entire downstream chain runs on thin air without a plan and a triage label.

**Normalize plan.md location:** If plan.md is found outside `.insightsLoop/current/`, copy it into `.insightsLoop/current/plan.md` before proceeding. All downstream steps and the archive operate on the `current/` copy.

## Definitions

- **"Task"** means a unit of work assigned to one Shipwright in one worktree. Not a loop iteration.
- **"Done"** means the step's output artifact is produced and the next step can consume it. The loop is done when Ship produces a shippable diff and the human confirms.

## Step 1: Frame

**Goal**: Read the plan, triage, detect greenfield, prepare for build.

### Greenfield Detection

Before triaging, check if the project needs scaffolding:

**Pass 1 — File existence (stack-agnostic):**
1. Check for a dependency manifest (`package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`, `pom.xml`, etc.)
2. Check for a framework entry point (the file where the app starts — `app/layout.tsx`, `src/main.tsx`, `main.py`, `main.go`, `src/main.rs`, `index.html`, etc.)
3. Check for framework config (`next.config.*`, `vite.config.*`, `django/settings.py`, `Makefile`, `docker-compose.yml`, etc.)
4. If any core file is missing → greenfield

**Pass 2 — Wiring verification (runs even if Pass 1 finds all files):**
5. Check that entry point has real content (not just a bare scaffold or empty export)
6. Check that dependencies are declared in the manifest (framework listed as a dependency)
7. Check that config connects to entry point (build tool knows where source lives)
8. For web projects: check that CSS/style entry exists with framework directives if applicable
9. If any wiring check fails → partially-scaffolded (treat as greenfield with pre-existing files noted)

**If greenfield or partially-scaffolded:**

Use `AskUserQuestion`: "Detected [greenfield / partially-scaffolded] project. Files already present: [list]. Missing or unwired: [list]. Generate scaffolding checklist? [Approve / Skip / Edit]"

If approved, generate checklist from plan's Architecture section. The checklist is stack-specific — derive from the chosen architecture:
- Read the plan's Architecture section for stack choice
- For each file needed to boot the stack, list: filename, minimum viable content (what it must contain to wire correctly), and whether it exists already
- For partially-scaffolded: mark existing files as "exists — verify wiring" vs missing as "create"
- Include design tokens from Visual Spec if present (CSS custom properties, font imports, color palette)
- Present checklist to user for confirmation — the LLM derives the checklist, the user validates it

Write checklist to `.insightsLoop/current/scaffolding-checklist.md`. This file is passed to Sentinel via brief and archived with the run (keep-list).

### Triage

Read `plan.md`. Confirm the triage label from the `## Challenge` section:

| Size | Criteria | Steps to run |
|------|----------|--------------|
| Small | 1 file, no new interfaces, existing patterns | 2 → 3 (Storm skips Pass 2 consistency for single-worktree) |
| Medium | Multi-file, existing patterns | All steps |
| Architectural | New interfaces, schema changes, public API | All steps, sequential challenge |

**Output artifact**: `.insightsLoop/current/frame.md` — confirmed triage label, task list with parallelization plan (which tasks share a worktree, which are independent), and which test files belong to which Shipwright.

Use the `AskUserQuestion` tool to present the frame and get approval. Options: "Approve — start building", "Adjust — change triage or scope", "Abort — back to plan".

### The Monkey at Frame

Launch the Monkey agent (Opus). Construct her brief using the template in `.claude/skills/insight-devloop/reference/monkey-brief-template.md` with step=frame. Context: plan.md + frame.md.

**Dedup with Plan Monkey:** If `.insightsLoop/current/monkey-plan.md` exists (written by the Navigator during `/insight-plan`), read it and include its finding in the "Previous Monkey findings this run" field. The Frame Monkey should not repeat what the Plan Monkey already challenged.

Output: `.insightsLoop/current/monkey-frame.md`

**IMPORTANT: Write `monkey-frame.md` immediately** after the Monkey agent returns. Agent output alone is not persistent — if you don't write the file, the next Monkey loses dedup context and the archive loses the artifact.

Present the Monkey's finding to the user alongside the frame. If `Survived: no`, discuss before proceeding.

## Step 2: Build

**Goal**: Write tests, then implement in isolated worktrees.

### 2a: TDD — The Sentinel (Opus)

**The Sentinel** writes tests from the plan. She must be a **separate agent** from the builder.

Read the Sentinel's SKILL.md at `.claude/skills/insight-sentinel/SKILL.md`. Paste the entire SKILL.md verbatim into the Agent prompt. Write context to `.insightsLoop/current/brief-sentinel.md`:

```markdown
# Sentinel Brief
## Plan
[full plan sections: Intent, Out of Scope, Architecture, Tasks, Key Files — NOT Challenge]
## Acceptance Criteria
[from plan, verbatim]
## Scaffolding Checklist
[read from .insightsLoop/current/scaffolding-checklist.md if greenfield, else "Not greenfield — skip"]
## TDD Matrix
[TDD-MATRIX.md content if exists, else "None"]
## Test Framework
[framework, test directory, existing patterns]
## Values
[VALUES.md content if exists, else "None"]
```

She produces: failing test suite (acceptance contracts first, then per-task contracts), written to the project's test directory.

### The Monkey at TDD

Launch the Monkey agent (Opus). Construct her brief using the template in `.claude/skills/insight-devloop/reference/monkey-brief-template.md` with step=tdd. Context: Sentinel's test suite + plan.md.

Output: `.insightsLoop/current/monkey-tdd.md`

**IMPORTANT: Write `monkey-tdd.md` immediately** after the Monkey agent returns. Agent output alone is not persistent — if you don't write the file, the next Monkey loses dedup context and the archive loses the artifact.

If `Survived: no` and the finding is specific enough to act on, add the test. If `Survived: yes`, move on. Present the finding to the user either way.

### 2b: Implement — The Shipwright (Sonnet, parallel worktrees)

Launch **Shipwright** agents per the parallelization plan from Frame. Each Shipwright runs in an **isolated worktree** (`isolation: "worktree"`) with clean context.

Read the Shipwright's SKILL.md at `.claude/skills/insight-shipwright/SKILL.md`. Paste the entire SKILL.md verbatim into the Agent prompt. Write context to `.insightsLoop/current/brief-shipwright.md` (one per Shipwright if parallel — use `brief-shipwright-1.md`, `brief-shipwright-2.md`):

```markdown
# Shipwright Brief
## Plan
[full plan.md including Challenge]
## Test Files
[list of test file paths assigned to this Shipwright]
## Task Scope
[which tasks from the plan are theirs]
## Values
[VALUES.md content if exists, else "None"]
## Visual Spec
[from plan, verbatim, if exists]
## Mockup Path
[path to mockup.html if exists, else "None" — do NOT paste HTML contents]
```

Independent tasks run in parallel. Dependent tasks run sequentially.

### The Monkey at Build

Launch the Monkey agent (Opus). Construct her brief using the template in `.claude/skills/insight-devloop/reference/monkey-brief-template.md` with step=build. Context: summary of what each worktree built + file lists. Use the single-worktree variant from the template if frame.md shows one Shipwright.

Output: `.insightsLoop/current/monkey-build.md`

**IMPORTANT: Write `monkey-build.md` immediately** after the Monkey agent returns. Agent output alone is not persistent — if you don't write the file, the archive loses the artifact.

If `Survived: no`, investigate the seam before merging. If `Survived: yes`, proceed to merge.

**Output artifact**: Passing implementations in worktrees.

## Step 3: Ship

**Goal**: Merge, normalize, verify, done.

### 3a: Merge

**Pre-merge check:** Only merge worktrees where the Shipwright completed successfully (all assigned tests pass). Skip stopped worktrees entirely. Present to the user: "Merging worktrees: [list]. Skipped (Shipwright stopped): [list]." If all worktrees were stopped, do not proceed to merge — present the failures and loop back to the user.

Merge all completed worktrees into the main branch. For each worktree:
1. Check which files were modified
2. If no overlap with other worktrees, fast-forward merge
3. If files overlap, present the conflict to the user — don't auto-resolve

If merge fails, stop and ask the user. Do not silently discard changes.

### 3b: Verify + Converge

**Three agents run on the merged diff. Storm and Cartographer run in parallel first, then the Ship Monkey runs after both return.**

#### Storm + Cartographer (parallel)

**The Storm — Adversarial Review + Consistency (Opus)**:

Read the Storm's SKILL.md at `.claude/skills/insight-storm/SKILL.md`. Paste the entire SKILL.md verbatim into the Agent prompt. Write context to `.insightsLoop/current/brief-storm-verify.md`:

```markdown
# Storm Brief (Verify Mode)
## Diff
[full merged diff]
## Values
[VALUES.md content]
## Intent
[1-2 sentences from plan Intent]
```

The Storm runs both passes in a single invocation — adversarial review first, consistency check second. For small changes (single worktree), tell her to write "Clean — single worktree, no cross-module changes." in the Consistency section.

Output: `.insightsLoop/current/storm-report.md` (format defined in Storm's SKILL.md — includes Introduced Issues, Consistency, and Pre-existing Issues sections)

**IMPORTANT: Write `storm-report.md` immediately.** When the Storm agent returns, write its findings to `.insightsLoop/current/storm-report.md` before proceeding. Agent output alone is not persistent — if you don't write the file, the archive loses the artifact.

**The Cartographer — Edge Case Hunter (Sonnet)** — invoke `/insight-edge-case-hunter` as the actual skill (use the Skill tool, not a general-purpose agent). Pass the merged diff as input. The Cartographer's SKILL.md defines her method and output format — do not paraphrase or substitute with an ad-hoc brief.

**Skip condition:** If the story is visual-only (layout, CSS, copy changes) with no new code paths, skip the Cartographer entirely. Mechanical path enumeration adds nothing when no branches exist to enumerate — Storm carries verification alone. Write an empty `edge-cases.md` (header only) for the archive and note "Skipped: visual-only change" at the top.

Output: `.insightsLoop/current/edge-cases.md` — empty report (header only, no rows) is valid.

**IMPORTANT: Write `edge-cases.md` immediately.** When the Cartographer returns, write its findings to `.insightsLoop/current/edge-cases.md` before proceeding. Agent output alone is not persistent.

#### Ship Monkey (after Storm + Cartographer)

**Do not skip. Do not proceed to 3c without running the Ship Monkey.**

Launch the Monkey agent (Opus). Construct her brief using the template in `.claude/skills/insight-devloop/reference/monkey-brief-template.md` with step=ship. Context: merged diff + storm-report.md + edge-cases.md.

Output: `.insightsLoop/current/monkey-ship.md`

**IMPORTANT: Write `monkey-ship.md` immediately** after the Monkey agent returns. Agent output alone is not persistent — if you don't write the file, the archive loses the artifact.

#### Converge and Present

**This is a hard gate. Do not proceed to 3c without completing this.**

After all three agents return (Storm, Cartographer, Ship Monkey) and their artifacts are written to disk:

1. Present a summary of ALL findings from this step to the user:
   - Storm: [N] introduced issues ([severity breakdown]), [N] consistency findings
   - Cartographer: [N] edge cases (or "skipped — visual only")
   - Ship Monkey: [technique used], Survived: [yes/no], Confidence: [score]
2. Use `AskUserQuestion`: "Verify step complete. Storm found [N] issues, Cartographer found [N] edge cases, Monkey [survived/didn't survive]. Proceed to consolidate and fix?" Options: "Proceed to fix pipeline / Discuss findings first / Stop — need to rethink"

**Why this gate exists:** Without it, the orchestrator runs Storm + Cartographer + Monkey and silently moves into the fix pipeline. The user never sees the findings before fixes start. This gate ensures the crew's analysis is visible and the user can redirect before auto-fixing begins.

### 3c: Consolidate + Fix Pipeline

**Step 1: Consolidate all findings** into `.insightsLoop/current/findings-consolidated.md`:

Merge findings from all sources: `monkey-frame.md`, `monkey-tdd.md`, `monkey-build.md`, `monkey-ship.md`, `storm-report.md`, `edge-cases.md`.

```markdown
# Consolidated Findings

| # | Source | Phase | Location | Issue | Severity | Status |
|---|--------|-------|----------|-------|----------|--------|
| 1 | Storm | Ship | route.ts:33 | API key not checked | Critical | Pending |
| 2 | Monkey | Build | route.ts:33 | API key not checked | High | Possible dup of #1 |
| 3 | Cartographer | Ship | IngredientInput:28 | No concurrent search guard | Medium | Backlog |
| 4 | Monkey | Frame | [concept] caching assumption | Architecture assumes cold start | Medium | Backlog |
```

**Location column contract:**
- **Actionable:** `file.ts:33` or `ComponentName:28` — has a file:line reference. Eligible for fix pipeline.
- **Conceptual:** `[concept] description` — prefixed with `[concept]`. No file:line. Goes straight to Backlog.

**Sort:** Group by severity (Critical → High → Medium → Low), sub-sort by file + line.

**No auto-dedup.** If findings look like duplicates, note "Possible dup of #N" but don't auto-collapse. User confirms.

**Step 2: Triage for fix pipeline.** Filter: `Severity ∈ {Critical, High}` AND Location is actionable (not `[concept]`) AND not `Dup of #N`. Present filtered list to user.

Use `AskUserQuestion`: "Consolidated findings: [N] total, [M] eligible for auto-fix pipeline. [list eligible]. Fix these, skip to backlog, or discuss?" Options: "Fix listed / Skip to backlog / Discuss"

**Step 3: Fix Pipeline (three agents, sequential).**

If user approves fixes:

**3a. Storm Fix Spec Mode.** Read the Storm's SKILL.md. Paste verbatim. Write context to `.insightsLoop/current/brief-storm-fixspec.md`:

```markdown
# Storm Brief (Fix Spec Mode)
## Triaged Findings
[critical/high findings with file:line locations — full Issue text, not truncated]
## Values
[VALUES.md content]
```

Storm writes `.insightsLoop/current/fix-specs.md` — one spec per finding with: regression test contract, fix location, fix intent, boundary (what NOT to touch). She does NOT write code or tests.

**3b. Sentinel writes regression tests.** Read Sentinel SKILL.md. Paste verbatim. Write context to `.insightsLoop/current/brief-sentinel-fix.md`:

```markdown
# Sentinel Brief (Fix Regression Mode)
## Fix Specs
[full fix-specs.md content]
## Test Framework
[framework, test directory, existing patterns]
## Values
[VALUES.md content]
```

Sentinel writes one regression test per fix spec. Each test must fail before the fix is applied.

**3c. Shipwright applies patches.** Read Shipwright SKILL.md. Paste verbatim. Write context to `.insightsLoop/current/brief-shipwright-fix.md`:

```markdown
# Shipwright Brief (Fix Mode)
## Fix Specs
[full fix-specs.md content]
## Failing Tests
[list of regression test files and their assertions]
## Values
[VALUES.md content]
```

Shipwright applies minimum patches. Runs full test suite. All tests must pass — old and new.

**Step 4: User gate.** "Fix pipeline patched [N] findings. Here's the diff and new tests. Approve?" If tests fail after fixes: stop, present failures to user. Max 2 fix attempts per finding.

**Step 5: Update consolidated report.** Set Status column: Fixed, Unresolved, Backlog, Dup of #N.

Also apply (without the pipeline) any remaining fixes:
- Storm consistency findings (cross-module assumption mismatches before naming)
- Cartographer findings that would corrupt data or crash at runtime
- Monkey findings where `Survived: no` and confidence is high
- Everything else goes to backlog

Re-run tests after all fixes.

### 3d: Verify clean

Run full test suite + typecheck. Confirm everything passes.

**Output artifact**: Shippable diff. Present summary to user.

## Step 4: Done

Write `.insightsLoop/current/summary.md`:

```markdown
# Run Summary

**Feature:** [from plan.md title]
**Date:** [ISO date]
**Triage:** [small/medium/architectural]

## What Was Built
[Brief description]

## Files
- Created: [list]
- Modified: [list]

## Tests
- Before: [count]
- After: [count]

## Findings
- Storm: [X critical, Y high, Z medium, W low]
- Cartographer: [X findings]
- Monkey: [X challenges, Y survived, Z didn't]

## Decisions
[Any decisions made during the build]
```

Then archive the run:
1. Determine next run number (look at existing `run-*` dirs)
2. Keep: `summary.md`, `plan.md`, `monkey-*.md`, `storm-report.md`, `storm-plan.md`, `findings-consolidated.md`, `fix-specs.md`, `scaffolding-checklist.md`, `mockup.html` (all if exists)
3. Delete: `frame.md`, `edge-cases.md`, `brief-*.md`
4. Rename `.insightsLoop/current/` → `.insightsLoop/run-NNNN-feature-name/`

Present summary to user. Suggest next: run `/insight-retro` to capture learnings.

## Error Handling

When things go wrong:
- **Sentinel writes tests that can't compile**: Stop. Present the error to the user. The plan might be ambiguous — loop back to clarifying the plan, not to forcing the tests.
- **Shipwright can't make tests pass after 3 attempts**: Stop the worktree. Present the failing tests and the Shipwright's last attempt to the user. The test or the plan might be wrong.
- **Merge conflict**: Never auto-resolve. Present both versions to the user. They decide which survives.
- **Tests pass in worktrees but fail after merge**: This is an integration bug. Present the failure. Check Monkey at Build findings — she might have already caught the seam.
- **Typecheck fails after all tests pass**: Present the type errors. These are usually naming mismatches between worktrees — check Storm's Consistency section in storm-report.md.
- **Tests fail after Step 3c fixes**: The fix broke something — this is a regression, not the original issue. Present both the original Storm/Cartographer finding and the newly failing test to the user. Do not retry the fix. Do not revert silently. The user decides: fix the regression, revert the fix and backlog the finding, or take a different approach.

## Model Assignment

| Role | Model | Why |
|------|-------|-----|
| TDD agent | Opus | Must correctly understand contracts — correlated failure protection is worthless with weak tests |
| Builder agents | Sonnet | Pattern-following implementation, speed matters |
| Adversarial + Consistency | Opus | Must find real issues and naming drift, not surface noise |
| Edge case hunter | Sonnet | Mechanical path enumeration, method not judgment |
| Monkey | Opus | Chaos requires intelligence. Dumb chaos is noise. |

## User Gates

Every decision point that requires user input MUST use the `AskUserQuestion` tool. Never present a decision as plain text — the user may not realize you're waiting. Plain text looks like the agent is still working. `AskUserQuestion` makes it unmistakable.

**Mandatory gates (always use `AskUserQuestion`):**

| When | Gate | Options |
|------|------|---------|
| Step 1: Frame | Approve triage and parallelization plan | Approve / Adjust / Abort |
| Step 2a: Monkey `Survived: no` | Monkey challenged the tests — user decides | Add test / Ignore / Rethink |
| Step 2b: Monkey `Survived: no` | Monkey challenged the build — user decides before merge | Investigate / Proceed / Stop |
| Step 3a: Merge conflict | Files overlap between worktrees | Show both versions, user picks |
| Step 3b: Converge (after Storm + Cartographer + Ship Monkey) | Present all findings before fix pipeline | Proceed to fix pipeline / Discuss findings first / Stop |
| Step 3d: After fixes + verify clean | Confirm shippable before archive | Ship / Fix more / Abort |

## Rules

- **Every user gate uses `AskUserQuestion`.** This is how the user knows you need them. No exceptions. If you're waiting for input, use the tool.
- **Never run TDD and build in the same agent.** This is the single most important rule. Correlated failure is silent and deadly.
- **The Monkey is a real agent.** Launch her with a brief, a context, and expect structured markdown back. She is not inline narrative. She is not optional. She is not decoration.
- **Always use worktree isolation for parallel agents.** Context quality degrades in shared sessions.
- **Empty edge case report is valid.** The Cartographer must not hallucinate findings to justify existence.
- **Human approves at Frame.** Don't start building without explicit go-ahead.
- **Plan is a hard gate.** No plan.md = no build. Non-negotiable.
- **Paste values into briefs.** "Read VALUES.md" is not enough for subagents. Paste the relevant content into each brief so it's in their context.
- **Archive runs, don't delete.** Completed runs move from `current/` to `run-NNNN-feature-name/`. History is how the loop improves.
- **Stop condition for findings.** Fix critical and high severity from Storm. Fix data-corruption and crash findings from Cartographer. Fix `Survived: no` high-confidence Monkey findings. The rest goes to backlog.
