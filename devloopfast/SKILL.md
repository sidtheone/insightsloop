---
name: devloopfast
description: "Speed mode build loop. Same crew, same Monkey, less ceremony. Auto-triages from plan.md (no Frame approval gate for small/medium), confidence-filters Storm and Cartographer findings (80+ only). The Monkey never sleeps — she just doesn't block. Use when you trust the plan and want to ship fast. Trigger on: 'fast build', 'quick build', 'devloopfast', 'speed mode', 'just build it'."
---

# DevLoopFast — Speed Mode

Same crew, same values, same Monkey, less ceremony. This is `/devloop` with two changes:

1. **Auto-triage** — Frame runs but doesn't wait for approval on small/medium changes. Only architectural changes gate on human approval.
2. **Confidence filtering** — Storm and Cartographer only surface findings with confidence 80+. Below that, logged to `filtered-findings.json` (never discarded — just not in your face).

The Monkey is not a ceremony. She's the immune system. She shows up at every step in both modes. The only difference: in speed mode she doesn't block the loop. She asks her question, logs the answer, and the crew keeps moving. If she finds something real, it goes into `filtered-findings.json` with a `"source": "monkey"` tag so you can see exactly what she caught.

## What's Different from /devloop

| Aspect | /devloop | /devloopfast |
|--------|----------|--------------|
| Frame approval | Always waits | Auto-approves small/medium, gates architectural |
| Monkey at Frame | Asks, waits | Asks, logs, moves on |
| Monkey at TDD | Asks, waits | Asks, logs, moves on |
| Monkey at Build | Asks, waits | Asks, logs, moves on |
| Monkey at Ship | Asks, waits | Asks, logs, moves on |
| Storm output | All findings | 80+ confidence only |
| Cartographer output | All findings | 80+ confidence only |
| Normalize | Runs for medium+ | Runs for architectural only |
| Filtered findings | N/A | Saved to `filtered-findings.json` |

## What's NOT Different

- Phase 0: Values still load. Non-negotiable.
- The Monkey shows up at every step. Non-negotiable.
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
| Small | 1 file, no new interfaces, existing patterns | Build → Ship (skip normalize) | Auto |
| Medium | Multi-file, existing patterns | Build → Ship (skip normalize) | Auto |
| Architectural | New interfaces, schema changes, public API | Full loop | **Wait for human** |

Write `frame.md` with triage label and task parallelization plan.

For small/medium: log the triage decision and proceed immediately.
For architectural: present to user, wait for approval.

### The Monkey at Frame

She still asks: "What if this triage is wrong?" If the answer changes the triage, re-triage. If not, log her question and move on. She doesn't block, but she always asks.

## Step 2: Build

No shortcuts here — this is where correctness lives.

### 2a: TDD — The Sentinel (Opus)

Separate agent. Receives plan WITHOUT Challenge section. Writes failing tests.

Brief: "You are The Sentinel. Write contracts like lives depend on them. Derive failure modes independently from the plan. Do NOT read the Challenge section. Follow the project's TDD matrix if one exists. You do NOT implement — you only write the tests."

### The Monkey at TDD

She picks one test and invents an input the Sentinel didn't consider. If it's a real gap, add the test. If not, log it and move on. She doesn't wait for approval — the test either gets added or it doesn't.

### 2b: Implement — The Shipwright (Sonnet, parallel worktrees)

Isolated worktrees per task. Each Shipwright makes its assigned tests pass.

Brief: "You are The Shipwright. Build fast, build clean, no wasted wood. Make the failing tests pass, nothing more."

### The Monkey at Build

She looks at the integration seam between worktrees. "What if the other worktree named this differently?" If she spots a real mismatch, flag it in `filtered-findings.json` with `"source": "monkey"`. The crew keeps building.

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

### The Monkey at Ship

"If you deployed this right now and went to sleep, what would wake you up?" She asks this regardless of triage size. Her answer gets logged to `filtered-findings.json` with `"source": "monkey"`. If it's 80+ confidence and critical/high severity, it gets surfaced like any other finding. She doesn't get special treatment — she earns her way past the filter like everyone else.

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
- Monkey findings count (e.g., "Monkey flagged 3 items across 4 steps")
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

- **The Monkey never sleeps.** She shows up at every step in both modes. Speed mode changes whether she blocks, not whether she exists. This is what makes InsightsLoop different — chaos is not optional ceremony.
- **Sentinel and Shipwright are never the same agent.** Speed mode doesn't compromise on correlated failure.
- **Always use worktree isolation.** Speed mode doesn't compromise on context quality.
- **Plan is a hard gate.** Speed mode doesn't mean no plan.
- **Filtered findings are never deleted.** They go to `filtered-findings.json`. The user can review them later. Transparency is non-negotiable — speed mode hides, it doesn't discard.
- **Monkey findings use the same filter.** She doesn't get a free pass. If her finding is below 80 confidence, it gets filtered like everything else. She earns attention the same way the Storm does.
- **Architectural changes always gate.** If the triage says architectural, this skill behaves exactly like `/devloop`. No auto-approval for big changes.
- **When in doubt, escalate.** If confidence is borderline (75-80), round up and show it. Better to over-report than to hide a real issue for speed.
