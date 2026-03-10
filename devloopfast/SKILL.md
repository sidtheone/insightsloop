---
name: devloopfast
description: "Speed mode build loop. Same crew, same Monkey, less ceremony. Auto-triages (no approval gate for small/medium), confidence-filters findings (80+ only). The Monkey never sleeps — she just doesn't block. Use when you trust the plan and want to ship fast. Trigger on: 'fast build', 'quick build', 'devloopfast', 'speed mode', 'just build it'."
---

# DevLoopFast — Speed Mode

Same crew, same values, same Monkey, less ceremony. This is `/devloop` with two changes:

1. **Auto-triage** — Frame runs but doesn't wait for approval on small/medium changes. Only architectural changes gate on human approval.
2. **Confidence filtering** — Storm, Cartographer, and Monkey findings filtered at 80+ confidence. Below that, logged to `.loop/filtered-findings.json` (never discarded — just not in your face).

The Monkey is not ceremony. She's the immune system. She runs at every step as a real agent with structured output. The only difference from `/devloop`: she doesn't block the loop. She produces her finding, it gets confidence-filtered like everything else, and the crew keeps moving.

## What's Different from /devloop

| Aspect | /devloop | /devloopfast |
|--------|----------|--------------|
| Frame approval | Always waits | Auto-approves small/medium, gates architectural |
| Monkey | Real agent, blocks on `survived: false` | Real agent, logs finding, moves on |
| Storm output | All findings | 80+ confidence only |
| Cartographer output | All findings | 80+ confidence only |
| Normalize | Runs for medium+ | Runs for architectural only |
| Filtered findings | N/A | `.loop/filtered-findings.json` |

## What's NOT Different

- Phase 0: Values still load and get pasted into briefs. Non-negotiable.
- The Monkey launches as a real agent at every step. Non-negotiable.
- Sentinel is still a separate agent from Shipwright.
- Worktree isolation stays.
- Plan is still a hard gate. No plan = no build.
- Tests still run. Code still passes before shipping.
- Error handling is the same — merge conflicts, test failures, and typecheck errors still stop the loop.

## Phase 0: Load Project Values

Same as `/devloop`. Read `VALUES.md` and `TDD-MATRIX.md`. Paste content into agent briefs. The Monkey reads VALUES.md herself.

## Artifact Directory

Same as `/devloop` — all artifacts in `.loop/`. Clean between runs. One addition:

```
.loop/
├── filtered-findings.json   (findings below 80 confidence)
└── ... (same as /devloop)
```

## Prerequisites

Same as `/devloop` — `plan.md` with `## Challenge` section must exist.

## Step 1: Frame (Auto-Triage)

Read `plan.md`. Determine triage from `## Challenge` section:

| Size | Criteria | What runs | Approval |
|------|----------|-----------|----------|
| Small | 1 file, no new interfaces, existing patterns | Build → Ship (skip normalize) | Auto |
| Medium | Multi-file, existing patterns | Build → Ship (skip normalize) | Auto |
| Architectural | New interfaces, schema changes, public API | Full loop | **Wait for human** |

Write `.loop/frame.md` with triage label and task parallelization plan.

For small/medium: log the triage decision and proceed immediately.
For architectural: present to user, wait for approval.

### The Monkey at Frame

Launch the Monkey agent. Same brief as `/devloop`. She produces `.loop/monkey-frame.json`.

If the finding has `survived: false`:
- For architectural: stop and discuss (same as /devloop)
- For small/medium: log to `.loop/filtered-findings.json`, proceed. But if the Monkey's finding would change the triage (e.g., a "small" is actually "medium"), re-triage even in speed mode. Triage correctness is not optional.

## Step 2: Build

Same as `/devloop`. No shortcuts at Build — this is where correctness lives.

### 2a: TDD — The Sentinel (Opus)

Same as `/devloop`. Same brief with pasted TDD-MATRIX.md and values.

### The Monkey at TDD

Launch the Monkey agent. Same brief as `/devloop`. She produces `.loop/monkey-tdd.json`.

If `survived: false` and the finding is a concrete test case (not abstract), add the test automatically. If it's abstract or low confidence, log to `.loop/filtered-findings.json`. No human gate — the test either gets added by the orchestrator or it doesn't.

### 2b: Implement — The Shipwright (Sonnet, parallel worktrees)

Same as `/devloop`. Same brief with pasted values.

### The Monkey at Build

Launch the Monkey agent. Same brief as `/devloop`. She produces `.loop/monkey-build.json`.

If `survived: false`, log to `.loop/filtered-findings.json`. Proceed to merge regardless — but if the finding specifically identifies a naming mismatch between worktrees, flag it for the merge step so it gets resolved there.

## Step 3: Ship (Filtered)

### 3a: Merge

Same as `/devloop`. Conflicts still stop the loop and go to the user.

### 3b: Normalize — The Editor

**Architectural only.** Skip for small and medium.

### 3c: Verify (parallel, confidence-filtered)

Two agents run in parallel. Same briefs as `/devloop`, but with one addition to each:

**Storm brief addition**: "For each finding, assign a confidence score (0-100) based on how certain you are this is a real issue, not a theoretical concern."

**Cartographer**: invoke `/edge-case-hunter` but add to the brief: "For each finding, add a confidence field (0-100) based on how certain you are this path is actually reachable and unguarded."

Storm output: `.loop/storm-report.json`:
```json
[{"location": "", "issue": "", "severity": "critical|high|medium|low", "confidence": 85, "suggestion": ""}]
```

Cartographer output: `.loop/edge-cases.json`:
```json
[{"location": "", "trigger_condition": "", "guard_snippet": "", "potential_consequence": "", "confidence": 90}]
```

**Filtering:**
- Findings with confidence 80+ → shown to user, fixed if critical/high
- Findings with confidence <80 → appended to `.loop/filtered-findings.json`
- Empty arrays remain valid
- Borderline (75-79): round up, show it. Better to over-surface than to miss.

### The Monkey at Ship

Launch the Monkey agent. Same brief as `/devloop`. She produces `.loop/monkey-ship.json`.

Her finding goes through the same 80+ confidence filter. No special treatment. She earns attention like everyone else.

### 3d: Fix

Fix only 80+ confidence findings that are critical or high severity. Append the rest to `.loop/filtered-findings.json`.

### 3e: Verify clean

Run full test suite + typecheck.

## Step 4: Done

Summarize:
- What was built
- Files modified/created
- Test count before → after
- Findings surfaced vs filtered (e.g., "4 shown, 7 filtered")
- Monkey report across all steps: technique used, what survived, what didn't
- Suggested next: run `/retro` or review `.loop/filtered-findings.json`

## Model Assignment

Same as `/devloop`. Monkey is Opus.

## Rules

- **The Monkey never sleeps.** She launches as a real agent at every step. Speed mode changes whether she blocks, not whether she exists.
- **Monkey findings use the same filter.** 80+ confidence or it goes to filtered-findings.json. She earns attention the same way the Storm does.
- **One exception: triage correction.** If the Monkey's Frame finding would change the triage size, act on it even if confidence is below 80. Getting the triage wrong cascades through every step.
- **Sentinel and Shipwright are never the same agent.**
- **Always use worktree isolation.**
- **Plan is a hard gate.**
- **Filtered findings are never deleted.** `.loop/filtered-findings.json` is the record. The user can review it. `/retro` reads it.
- **Architectural changes always gate.** If triage says architectural, this skill behaves exactly like `/devloop`.
- **Clean .loop/ between runs.** Same as devloop.
- **Same error handling as /devloop.** Merge conflicts, test failures, and typecheck errors still stop the loop. Speed mode doesn't mean reckless mode.
