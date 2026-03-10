---
name: devloopfast
description: "Speed mode build loop. Same crew, same Monkey, less ceremony. Auto-triages (no approval gate for small/medium), confidence-filters findings (80+ only). The Monkey never sleeps — she just doesn't block. Use when you trust the plan and want to ship fast. Trigger on: 'fast build', 'quick build', 'devloopfast', 'speed mode', 'just build it'."
---

# DevLoopFast — Speed Mode

Same crew, same values, same Monkey, less ceremony. This is `/devloop` with two changes:

1. **Auto-triage** — Frame runs but doesn't wait for approval on small/medium changes. Only architectural changes gate on human approval.
2. **Confidence filtering** — Storm, Cartographer, and Monkey findings filtered at 80+ confidence. Below that, logged to `.insightsLoop/current/filtered-findings.md` (never discarded — just not in your face).

The Monkey is not ceremony. She's the immune system. She runs at every step as a real agent with structured output. The only difference from `/devloop`: she doesn't block the loop. She produces her finding, it gets confidence-filtered like everything else, and the crew keeps moving.

## What's Different from /devloop

| Aspect | /devloop | /devloopfast |
|--------|----------|--------------|
| Frame approval | Always waits | Auto-approves small/medium, gates architectural |
| Monkey | Real agent, blocks on `Survived: no` | Real agent, logs finding, moves on |
| Storm output | All findings | 80+ confidence only |
| Cartographer output | All findings | 80+ confidence only |
| Normalize | Runs for medium+ | Runs for architectural only |
| Filtered findings | N/A | `filtered-findings.md` |

## What's NOT Different

- Phase 0: Values still load and get pasted into briefs. Non-negotiable.
- The Monkey launches as a real agent at every step. Non-negotiable.
- Sentinel is still a separate agent from Shipwright.
- Worktree isolation stays.
- Plan is still a hard gate. No plan = no build.
- Tests still run. Code still passes before shipping.
- Error handling is the same — merge conflicts, test failures, and typecheck errors still stop the loop.
- Run archiving is the same — `current/` → `run-NNNN-feature-name/` on completion.

## Phase 0: Load Project Values

Same as `/devloop`. Read `VALUES.md` and `TDD-MATRIX.md`. Paste content into agent briefs. The Monkey reads VALUES.md herself.

## Artifact Directory

Same as `/devloop` — all artifacts in `.insightsLoop/current/` during the run, archived to `run-NNNN-feature-name/` on completion. One additional artifact:

- `filtered-findings.md` — findings below 80 confidence, kept in archive for retro evaluation

## Prerequisites

Same as `/devloop` — `plan.md` with `## Challenge` section must exist.

## Step 1: Frame (Auto-Triage)

Read `plan.md`. Determine triage from `## Challenge` section:

| Size | Criteria | What runs | Approval |
|------|----------|-----------|----------|
| Small | 1 file, no new interfaces, existing patterns | Build → Ship (skip normalize) | Auto |
| Medium | Multi-file, existing patterns | Build → Ship (skip normalize) | Auto |
| Architectural | New interfaces, schema changes, public API | Full loop | **Wait for human** |

Write `.insightsLoop/current/frame.md` with triage label and task parallelization plan.

For small/medium: log the triage decision and proceed immediately.
For architectural: present to user, wait for approval.

### The Monkey at Frame

Launch the Monkey agent. Same brief as `/devloop`. She produces `.insightsLoop/current/monkey-frame.md`.

If `Survived: no`:
- For architectural: stop and discuss (same as /devloop)
- For small/medium: log to `filtered-findings.md`, proceed. But if the Monkey's finding would change the triage (e.g., a "small" is actually "medium"), re-triage even in speed mode. Triage correctness is not optional.

## Step 2: Build

Same as `/devloop`. No shortcuts at Build — this is where correctness lives.

### 2a: TDD — The Sentinel (Opus)

Same as `/devloop`. Same brief with pasted TDD-MATRIX.md and values.

### The Monkey at TDD

Launch the Monkey agent. Same brief as `/devloop`. She produces `.insightsLoop/current/monkey-tdd.md`.

If `Survived: no` and the finding is a concrete test case (not abstract), add the test automatically. If it's abstract or low confidence, log to `filtered-findings.md`. No human gate — the test either gets added by the orchestrator or it doesn't.

### 2b: Implement — The Shipwright (Sonnet, parallel worktrees)

Same as `/devloop`. Same brief with pasted values.

### The Monkey at Build

Launch the Monkey agent. Same brief as `/devloop`. She produces `.insightsLoop/current/monkey-build.md`.

If `Survived: no`, log to `filtered-findings.md`. Proceed to merge regardless — but if the finding specifically identifies a naming mismatch between worktrees, flag it for the merge step so it gets resolved there.

## Step 3: Ship (Filtered)

### 3a: Merge

Same as `/devloop`. Conflicts still stop the loop and go to the user.

### 3b: Normalize — The Editor

**Architectural only.** Skip for small and medium.

### 3c: Verify (parallel, confidence-filtered)

Two agents run in parallel. Same briefs as `/devloop`, but with one addition to each:

**Storm brief addition**: "For each finding, assign a confidence score (0-100) based on how certain you are this is a real issue, not a theoretical concern. Add a Confidence column to the table."

**Cartographer brief addition**: "For each finding, add a Confidence column (0-100) based on how certain you are this path is actually reachable and unguarded."

Storm output: `.insightsLoop/current/storm-report.md`:

```markdown
# Storm Report

| Location | Issue | Severity | Confidence | Suggestion |
|----------|-------|----------|------------|------------|
| `src/lib/auth.ts:45` | Token skips issuer check | critical | 90 | Add issuer verification |
```

Cartographer output: `.insightsLoop/current/edge-cases.md` — same format with Confidence column.

**Filtering:**
- Findings with confidence 80+ → shown to user, fixed if critical/high
- Findings with confidence <80 → appended to `.insightsLoop/current/filtered-findings.md`
- Empty reports remain valid
- Borderline (75-79): round up, show it. Better to over-surface than to miss.

### The Monkey at Ship

Launch the Monkey agent. Same brief as `/devloop`. She produces `.insightsLoop/current/monkey-ship.md`.

Her finding goes through the same 80+ confidence filter. No special treatment. She earns attention like everyone else.

### 3d: Fix

Fix only 80+ confidence findings that are critical or high severity. Append the rest to `filtered-findings.md`.

### 3e: Verify clean

Run full test suite + typecheck.

## Step 4: Done

Same as `/devloop` — write `summary.md`, archive the run. One addition to summary:

```markdown
## Filtering
- Surfaced: [X findings]
- Filtered: [Y findings → filtered-findings.md]
- Monkey: [X challenges across 4 steps, Y survived, Z didn't]
```

**Archive keeps one extra file:** `filtered-findings.md` is preserved in the run directory alongside the standard archive set (summary, plan, monkey-*, storm-report).

## Model Assignment

Same as `/devloop`. Monkey is Opus.

## Rules

- **The Monkey never sleeps.** She launches as a real agent at every step. Speed mode changes whether she blocks, not whether she exists.
- **Monkey findings use the same filter.** 80+ confidence or it goes to filtered-findings.md. She earns attention the same way the Storm does.
- **One exception: triage correction.** If the Monkey's Frame finding would change the triage size, act on it even if confidence is below 80. Getting the triage wrong cascades through every step.
- **Sentinel and Shipwright are never the same agent.**
- **Always use worktree isolation.**
- **Plan is a hard gate.**
- **Filtered findings are never deleted.** `filtered-findings.md` survives into the archived run. The user and `/retro` can review it.
- **Architectural changes always gate.** If triage says architectural, this skill behaves exactly like `/devloop`.
- **Archive runs, don't delete.** Same as devloop.
- **Same error handling as /devloop.** Merge conflicts, test failures, and typecheck errors still stop the loop. Speed mode doesn't mean reckless mode.
