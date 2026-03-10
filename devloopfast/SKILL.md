---
name: devloopfast
description: "Speed mode build loop. Same crew, less ceremony. Auto-triages from plan.md (no Frame approval gate for small/medium), confidence-filters Storm and Cartographer findings (80+ only). Use when you trust the plan and want to ship fast. Trigger on: 'fast build', 'quick build', 'devloopfast', 'speed mode', 'just build it'."
---

# DevLoopFast — Speed Mode

Same crew, same values, less ceremony. This is `/devloop` with two changes:

1. **Auto-triage** — Frame runs but doesn't wait for approval on small/medium changes. Only architectural changes gate on human approval.
2. **Confidence filtering** — Storm and Cartographer only surface findings with confidence 80+. Below that, silently logged to `filtered-findings.json` (never discarded — just not in your face).

Everything else is identical to `/devloop`. Sentinel is still separate from Shipwright. Values still load. Worktrees still isolate.

## What's Different from /devloop

| Aspect | /devloop | /devloopfast |
|--------|----------|--------------|
| Frame approval | Always waits | Auto-approves small/medium, gates architectural |
| Monkey at Frame | Asks, waits | Asks, logs, moves on |
| Monkey at TDD | Asks, waits | Skipped |
| Monkey at Build | Asks, waits | Skipped |
| Monkey at Ship | Asks, waits | Asks, logs, moves on |
| Storm output | All findings | 80+ confidence only |
| Cartographer output | All findings | 80+ confidence only |
| Normalize | Runs for medium+ | Runs for architectural only |
| Filtered findings | N/A | Saved to `filtered-findings.json` |

## What's NOT Different

- Phase 0: Values still load. Non-negotiable.
- Sentinel is still a separate agent from Shipwright. Correlated failure protection stays.
- Worktree isolation stays.
- Plan is still a hard gate. No plan = no build.
- Tests still run. Code still passes before shipping.

## Phase 0: Load Project Values

Before anything else, check the repo root for `VALUES.md` and `TDD-MATRIX.md`. If they exist, read them and adhere to them throughout the entire loop. Brief every agent (Sentinel, Shipwright, Editor, Storm) with the key principles. If they don't exist, proceed without them.

## Prerequisites

Same as `/devloop` — `plan.md` with `## Challenge` section must exist.

## Step 1: Frame (Auto-Triage)

Read `plan.md`. Determine triage from `## Challenge` section:

| Size | Criteria | What runs | Approval |
|------|----------|-----------|----------|
| Small | 1 file, no new interfaces, existing patterns | Build → Ship (skip normalize, skip Monkey) | Auto |
| Medium | Multi-file, existing patterns | Build → Ship (skip normalize) | Auto |
| Architectural | New interfaces, schema changes, public API | Full loop | **Wait for human** |

Write `frame.md` with triage label and task parallelization plan.

For small/medium: log the triage decision and proceed immediately.
For architectural: present to user, wait for approval.

## Step 2: Build

Identical to `/devloop`. No shortcuts here — this is where correctness lives.

### 2a: TDD — The Sentinel (Opus)

Separate agent. Receives plan WITHOUT Challenge section. Writes failing tests.

Brief: "You are The Sentinel. Write contracts like lives depend on them. Derive failure modes independently from the plan. Do NOT read the Challenge section. Follow the project's TDD matrix if one exists. You do NOT implement — you only write the tests."

### 2b: Implement — The Shipwright (Sonnet, parallel worktrees)

Isolated worktrees per task. Each Shipwright makes its assigned tests pass.

Brief: "You are The Shipwright. Build fast, build clean, no wasted wood. Make the failing tests pass, nothing more."

## Step 3: Ship (Filtered)

### 3a: Merge

Merge all worktrees. Resolve conflicts.

### 3b: Normalize — The Editor

**Architectural only.** Skip for small and medium.

### 3c: Verify (parallel, confidence-filtered)

Two agents run in parallel on the merged diff:

**The Storm — Adversarial Review (Opus)**:

Brief with: "You are The Storm. Find the leak before the sea does. For each finding, assign a confidence score (0-100) based on how certain you are this is a real issue, not a theoretical concern. Be specific — name the file, line, and scenario. Output as structured JSON."

Output: `storm-report.json` — structured JSON array:
```json
{"location": "", "issue": "", "severity": "critical|high|medium|low", "confidence": 85, "suggestion": ""}
```

**The Cartographer — Edge Case Hunter (Sonnet)**:

Output: `edge-cases.json` — structured JSON array:
```json
{"location": "", "trigger_condition": "", "guard_snippet": "", "potential_consequence": "", "confidence": 90}
```

**Filtering:**
- Findings with confidence 80+ → shown to user, fixed if critical/high
- Findings with confidence <80 → written to `filtered-findings.json`, not surfaced
- Empty arrays remain valid

### 3d: Fix

Fix only 80+ confidence findings that are critical or high severity. Rest goes to `filtered-findings.json`.

### 3e: Verify clean

Run full test suite + typecheck.

## Step 4: Done

Summarize:
- What was built
- Files modified/created
- Test count before → after
- Findings surfaced vs filtered (e.g., "4 shown, 7 filtered to filtered-findings.json")
- Suggested next: run `/retro` or review `filtered-findings.json`

## Model Assignment

Same as `/devloop`:

| Role | Model |
|------|-------|
| TDD agent | Opus |
| Builder agents | Sonnet |
| Normalize | Opus |
| Adversarial reviewer | Opus |
| Edge case hunter | Sonnet |

## Rules

- **Sentinel and Shipwright are never the same agent.** Speed mode doesn't compromise on correlated failure.
- **Always use worktree isolation.** Speed mode doesn't compromise on context quality.
- **Plan is a hard gate.** Speed mode doesn't mean no plan.
- **Filtered findings are never deleted.** They go to `filtered-findings.json`. The user can review them later. Transparency is non-negotiable — speed mode hides, it doesn't discard.
- **Architectural changes always gate.** If the triage says architectural, this skill behaves exactly like `/devloop`. No auto-approval for big changes.
- **When in doubt, escalate.** If confidence is borderline (75-80), round up and show it. Better to over-report than to hide a real issue for speed.
