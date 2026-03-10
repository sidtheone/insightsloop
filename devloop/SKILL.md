---
name: insight-devloop
description: "4-step build loop for human+AI teams. Consumes plan.md (with Challenge section) from /insight-plan, then executes: Frame (triage) → Build (TDD + parallel worktrees) → Ship (merge + normalize + verify). Use after /plan produces artifacts, or for any scoped task ready to build. Trigger on: 'build this', 'execute the plan', 'run devloop', 'start building', or when plan.md exists and user wants to proceed."
---

# DevLoop — The Crew

A 4-step build loop that takes plan artifacts and ships verified code. Each step has a crew member responsible for it. Each step produces an artifact consumed by the next.

## The Crew

| Role | Persona | Model | Output |
|------|---------|-------|--------|
| TDD | **The Sentinel** | Opus | Failing test suite |
| Builder | **The Shipwright** | Sonnet | Passing implementation in worktree |
| Normalize | **The Editor** | Opus | `normalization.md` |
| Adversarial | **The Storm** | Opus | `storm-report.md` |
| Edge Cases | **The Cartographer** | Sonnet | `edge-cases.md` |
| Chaos | **The Monkey** | Opus | `monkey-[step].md` per step |
| Retro | **The Lookout** | Sonnet | Learnings (separate skill) |

## Phase 0: Load Project Values

Before anything else, check the repo root for `VALUES.md` and `TDD-MATRIX.md`. If they exist, read them. You will paste the relevant content into every agent brief so they actually receive it — not just a vague instruction to "follow values."

How to brief agents with values:
- Sentinel: paste TDD-MATRIX.md content + key values (YAGNI, simplicity, no over-engineering)
- Shipwright: paste key values (YAGNI, simplicity, "best code is no code", no gold-plating)
- Editor: paste naming/consistency values if they exist
- Storm: paste values so she can check the code against them
- Monkey: she reads VALUES.md herself — values are her weapons

Also read the crew SKILL.md files. These define each crew member's stable identity, method, and rules:
- `.claude/skills/insight-sentinel/SKILL.md` — The Sentinel's TDD contracts method
- `.claude/skills/insight-shipwright/SKILL.md` — The Shipwright's implementation method
- `.claude/skills/insight-storm/SKILL.md` — The Storm's adversarial review method
- `.claude/skills/insight-editor/SKILL.md` — The Editor's normalization method

When briefing agents, paste the relevant SKILL.md content (Identity, Method, Rules) into their brief — do not paraphrase. The SKILL.md is the single source of truth for how each crew member operates.

Also read `.insightsLoop/config.md` for engine tunables. Key settings:
- `monkey_findings_per_step` (default: 1) — how many findings the Monkey produces at each step. If > 1, tell the Monkey: "Produce N findings, each using a different technique. Each finding gets its own Technique/Target/Confidence/Survived block in the output file."
- `confidence_threshold` — used by devloopfast only (default: 80)

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
│   ├── edge-cases.md
│   └── normalization.md
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
- `summary.md` — the manifest of what happened.

## What to Discard

These are deleted when `current/` becomes `run-NNNN/`:
- `frame.md` — operational, triage is captured in summary.md.
- `normalization.md` — fixes already applied.
- `edge-cases.md` — either fixed or covered by storm-report.md.

## Prerequisites

This skill expects `plan.md` (with a `## Challenge` section) — either in `.insightsLoop/current/` or the repo root. If it doesn't exist, **do not proceed**. Tell the user to run `/insight-plan` first. This is a hard gate — the entire downstream chain runs on thin air without a plan.

## Definitions

- **"Task"** means a unit of work assigned to one Shipwright in one worktree. Not a loop iteration.
- **"Done"** means the step's output artifact is produced and the next step can consume it. The loop is done when Ship produces a shippable diff and the human confirms.

## Step 1: Frame

**Goal**: Read the plan, triage, prepare for build.

Read `plan.md`. Confirm the triage label from the `## Challenge` section:

| Size | Criteria | Steps to run |
|------|----------|--------------|
| Small | 1 file, no new interfaces, existing patterns | 2 → 3 (skip normalize) |
| Medium | Multi-file, existing patterns | All steps |
| Architectural | New interfaces, schema changes, public API | All steps, sequential challenge |

**Output artifact**: `.insightsLoop/current/frame.md` — confirmed triage label, task list with parallelization plan (which tasks share a worktree, which are independent), and which test files belong to which Shipwright.

Use the `AskUserQuestion` tool to present the frame and get approval. Options: "Approve — start building", "Adjust — change triage or scope", "Abort — back to plan".

### The Monkey at Frame

Launch the Monkey agent (Opus) with:
- Context: the plan.md content and the frame.md you just produced
- Step: "frame"

Brief: "You are The Monkey. Read the plan and the frame. Read `VALUES.md` if it exists.

Your arsenal: Assumption Flip, Hostile Input, Existence Question, Scale Shift, Time Travel, Cross-Seam Probe, Requirement Inversion, Delete Probe. Best techniques for Frame: **Assumption Flip, Scale Shift, Existence Question**.

Previous Monkey findings this run: None — first step.

Challenge the triage decision or scope boundaries. Pick one technique and apply it with specificity — name the file, function, line, scenario. Write your finding using the Monkey output format (Technique, Target, Confidence, Survived, Observation, Consequence)."

Output: `.insightsLoop/current/monkey-frame.md`

Present the Monkey's finding to the user alongside the frame. If `Survived: no`, discuss before proceeding.

## Step 2: Build

**Goal**: Write tests, then implement in isolated worktrees.

### 2a: TDD — The Sentinel (Opus)

**The Sentinel** writes tests from the plan. She must be a **separate agent** from the builder.

Read the Sentinel's SKILL.md at `.claude/skills/insight-sentinel/SKILL.md`. Construct her brief by pasting:
1. Her Identity and Method sections (from SKILL.md)
2. Her Rules section (from SKILL.md)
3. The specific context for this run:
   - Plan.md sections: Intent, Out of Scope, Architecture, Tasks, Key Files (NOT Challenge — correlated failure protection)
   - TDD-MATRIX.md content (if it exists)
   - Test framework info (framework, test directory, existing test patterns)
   - Key values from VALUES.md: YAGNI, simplicity, no over-engineering

She produces: failing test suite, written to the project's test directory.

### The Monkey at TDD

Launch the Monkey agent (Opus) with:
- Context: the test suite the Sentinel just wrote + plan.md
- Step: "tdd"

Brief: "You are The Monkey. Read the test suite the Sentinel just wrote and the plan. Read `VALUES.md` if it exists.

Your arsenal: Assumption Flip, Hostile Input, Existence Question, Scale Shift, Time Travel, Cross-Seam Probe, Requirement Inversion, Delete Probe. Best techniques for TDD: **Hostile Input, Requirement Inversion, Delete Probe**.

Previous Monkey findings this run: [1-line summary of monkey-frame.md finding]. Pick a different target than your Frame finding.

Find the test suite's blind spot. Pick one technique and apply it with specificity — name the file, function, line, scenario. Write your finding using the Monkey output format."

Output: `.insightsLoop/current/monkey-tdd.md`

If `Survived: no` and the finding is specific enough to act on, add the test. If `Survived: yes`, move on. Present the finding to the user either way.

### 2b: Implement — The Shipwright (Sonnet, parallel worktrees)

Launch **Shipwright** agents per the parallelization plan from Frame. Each Shipwright runs in an **isolated worktree** (`isolation: "worktree"`) with clean context.

Read the Shipwright's SKILL.md at `.claude/skills/insight-shipwright/SKILL.md`. Construct each brief by pasting:
1. The Shipwright's Identity and Method sections (from SKILL.md)
2. The Rules section (from SKILL.md)
3. The specific context for this task:
   - Full plan.md (including Challenge section)
   - The test files assigned to this Shipwright (from frame.md)
   - Its specific task scope (which tasks from the plan are theirs)
   - Key values from VALUES.md: YAGNI, simplicity, "best code is no code", no gold-plating
   - If Visual Spec exists in plan: paste it verbatim (the Shipwright's SKILL.md defines how to handle it)

Independent tasks run in parallel. Dependent tasks run sequentially.

### The Monkey at Build

Launch the Monkey agent (Opus) with:
- Context: summary of what each worktree built, file lists from each
- Step: "build"

Brief: "You are The Monkey. Read what each Shipwright built. Read `VALUES.md` if it exists.

Your arsenal: Assumption Flip, Hostile Input, Existence Question, Scale Shift, Time Travel, Cross-Seam Probe, Requirement Inversion, Delete Probe. Best techniques for Build: **Cross-Seam Probe, Time Travel, Scale Shift**.

Previous Monkey findings this run: [1-line summary of monkey-frame.md and monkey-tdd.md findings]. Pick a different target.

Find where two worktrees made different assumptions about a shared concept. Pick one technique and apply it with specificity — name the file, function, line, scenario. Write your finding using the Monkey output format."

Output: `.insightsLoop/current/monkey-build.md`

If `Survived: no`, investigate the seam before merging. If `Survived: yes`, proceed to merge.

**Output artifact**: Passing implementations in worktrees.

## Step 3: Ship

**Goal**: Merge, normalize, verify, done.

### 3a: Merge

Merge all worktrees into the main branch. For each worktree:
1. Check which files were modified
2. If no overlap with other worktrees, fast-forward merge
3. If files overlap, present the conflict to the user — don't auto-resolve

If merge fails, stop and ask the user. Do not silently discard changes.

### 3b: Normalize — The Editor (Opus)

**The Editor** reviews the full merged diff for conceptual consistency. Skip for small changes (single worktree, nothing to normalize).

Read the Editor's SKILL.md at `.claude/skills/insight-editor/SKILL.md`. Construct the brief by pasting:
1. The Editor's Identity and Method sections (from SKILL.md)
2. The Rules section (from SKILL.md)
3. The specific context:
   - The full merged diff
   - Key values on naming/consistency from VALUES.md (if they exist)

**Output**: `.insightsLoop/current/normalization.md`

**IMPORTANT: Write `normalization.md` immediately** after the Editor agent returns. Agent output alone is not persistent — if you don't write the file, the archive loses the artifact.

Apply normalization fixes before verification.

### 3c: Verify (parallel)

Two agents run in parallel on the merged diff:

**The Storm — Adversarial Review (Opus)**:

Read the Storm's SKILL.md at `.claude/skills/insight-storm/SKILL.md`. Construct the brief by pasting:
1. The Storm's Identity and Method sections (from SKILL.md)
2. The Rules section (from SKILL.md)
3. The specific context:
   - The full merged diff
   - VALUES.md content (full)
   - Feature context: 1-2 sentences from plan Intent

Output: `.insightsLoop/current/storm-report.md` (format defined in Storm's SKILL.md)

**IMPORTANT: Write `storm-report.md` immediately.** When the Storm agent returns, write its findings to `.insightsLoop/current/storm-report.md` before proceeding. Do not proceed to Fix until the file exists on disk. Agent output alone is not persistent — if you don't write the file, the archive loses the artifact.

**The Cartographer — Edge Case Hunter (Sonnet)** — invoke `/insight-edge-case-hunter` as the actual skill (use the Skill tool, not a general-purpose agent). Pass the merged diff as input. The Cartographer's SKILL.md defines her method and output format — do not paraphrase or substitute with an ad-hoc brief.

**Skip condition:** If the story is visual-only (layout, CSS, copy changes) with no new code paths, skip the Cartographer entirely. Mechanical path enumeration adds nothing when no branches exist to enumerate — Storm carries verification alone. Write an empty `edge-cases.md` (header only) for the archive and note "Skipped: visual-only change" at the top.

Output: `.insightsLoop/current/edge-cases.md` — empty report (header only, no rows) is valid.

**IMPORTANT: Write `edge-cases.md` immediately.** When the Cartographer returns, write its findings to `.insightsLoop/current/edge-cases.md` before proceeding. Agent output alone is not persistent.

### The Monkey at Ship

Launch the Monkey agent (Opus) with:
- Context: merged diff + storm-report.md + edge-cases.md
- Step: "ship"

Brief: "You are The Monkey. Read the merged diff, the Storm's report, and the Cartographer's map. Read `VALUES.md` if it exists.

Your arsenal: Assumption Flip, Hostile Input, Existence Question, Scale Shift, Time Travel, Cross-Seam Probe, Requirement Inversion, Delete Probe. Best techniques for Ship: **Time Travel, Scale Shift, Hostile Input**.

Previous Monkey findings this run: [1-line summary of monkey-frame.md, monkey-tdd.md, and monkey-build.md findings]. Pick a different target from all previous findings.

Find the operational edge case that works in tests but fails at 3am. Pick one technique and apply it with specificity — name the file, function, line, scenario. Write your finding using the Monkey output format."

Output: `.insightsLoop/current/monkey-ship.md`

If `Survived: no` and confidence is high, treat it like a Storm finding and fix it. Present all Monkey findings to the user regardless.

### 3d: Fix

Triage and apply fixes:
1. Storm critical/high severity first
2. Cartographer findings that would corrupt data or crash at runtime
3. Monkey findings where `Survived: no` and confidence is high
4. Normalization fixes
5. Everything else goes to backlog

When Storm and Cartographer findings reference the same location, present both to the user — don't resolve silently.

Re-run tests after fixes.

### 3e: Verify clean

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
2. Keep: `summary.md`, `plan.md`, `monkey-*.md`, `storm-report.md`
3. Delete: `frame.md`, `normalization.md`, `edge-cases.md`
4. Rename `.insightsLoop/current/` → `.insightsLoop/run-NNNN-feature-name/`

Present summary to user. Suggest next: run `/insight-retro` to capture learnings.

## Error Handling

When things go wrong:
- **Sentinel writes tests that can't compile**: Stop. Present the error to the user. The plan might be ambiguous — loop back to clarifying the plan, not to forcing the tests.
- **Shipwright can't make tests pass after 3 attempts**: Stop the worktree. Present the failing tests and the Shipwright's last attempt to the user. The test or the plan might be wrong.
- **Merge conflict**: Never auto-resolve. Present both versions to the user. They decide which survives.
- **Tests pass in worktrees but fail after merge**: This is an integration bug. Present the failure. Check Monkey at Build findings — she might have already caught the seam.
- **Typecheck fails after all tests pass**: Present the type errors. These are usually naming mismatches between worktrees — check normalization.md.

## Model Assignment

| Role | Model | Why |
|------|-------|-----|
| TDD agent | Opus | Must correctly understand contracts — correlated failure protection is worthless with weak tests |
| Builder agents | Sonnet | Pattern-following implementation, speed matters |
| Normalize | Opus | Conceptual consistency requires deep understanding |
| Adversarial reviewer | Opus | Must find real issues, not surface noise |
| Edge case hunter | Sonnet | Mechanical path enumeration, method not judgment |
| Monkey | Opus | Chaos requires intelligence. Dumb chaos is noise. |

## Rules

- **Never run TDD and build in the same agent.** This is the single most important rule. Correlated failure is silent and deadly.
- **The Monkey is a real agent.** Launch her with a brief, a context, and expect structured markdown back. She is not inline narrative. She is not optional. She is not decoration.
- **Always use worktree isolation for parallel agents.** Context quality degrades in shared sessions.
- **Empty edge case report is valid.** The Cartographer must not hallucinate findings to justify existence.
- **Human approves at Frame.** Don't start building without explicit go-ahead.
- **Plan is a hard gate.** No plan.md = no build. Non-negotiable.
- **Paste values into briefs.** "Read VALUES.md" is not enough for subagents. Paste the relevant content into each brief so it's in their context.
- **Archive runs, don't delete.** Completed runs move from `current/` to `run-NNNN-feature-name/`. History is how the loop improves.
- **Stop condition for findings.** Fix critical and high severity from Storm. Fix data-corruption and crash findings from Cartographer. Fix `Survived: no` high-confidence Monkey findings. The rest goes to backlog.
