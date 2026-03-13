---
name: insight-devloopfast
description: "Speed mode build loop. Same crew, same Monkey, less ceremony. Auto-triages (no approval gate for small/medium), confidence-filters findings (80+ only). The Monkey never sleeps — she just doesn't block. Use when you trust the plan and want to ship fast. Trigger on: 'fast build', 'quick build', 'devloopfast', 'speed mode', 'just build it'."
model: opus
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx jest*), Bash(npx tsc*), Bash(git *), Agent, Skill(frontend-design), AskUserQuestion
---

# DevLoopFast — Speed Mode

Same crew, same values, same Monkey, less ceremony. This is `/insight-devloop` with two changes:

1. **Auto-triage** — Frame runs but doesn't wait for approval on small/medium changes. Only architectural changes gate on human approval.
2. **Confidence filtering** — Storm, Cartographer, and Monkey findings filtered at 80+ confidence. Below that, logged to `.insightsLoop/current/filtered-findings.md` (never discarded — just not in your face).

The Monkey runs at Frame (all verticals against the plan) and Build (all verticals against the merged diff). Storm handles TDD review. The only difference from `/insight-devloop`: findings don't block the loop — they get confidence-filtered like everything else, and the crew keeps moving.

## What's Different from /insight-devloop

| Aspect | /insight-devloop | /insight-devloopfast |
|--------|----------|--------------|
| Frame approval | Always waits | Auto-approves small/medium, gates architectural |
| Monkey | Real agent at Frame + Build, blocks on `Survived: no` | Real agent at Frame + Build, logs finding, moves on |
| Storm output | All findings | 80+ confidence only |
| Cartographer output | All findings | 80+ confidence only |
| Filtered findings | N/A | `filtered-findings.md` |

## What's NOT Different

- Phase 0: Values still load and get pasted into briefs. Non-negotiable.
- Brief construction: paste SKILL.md verbatim, write context to brief files, present output as-is.
- Greenfield detection: two-pass (existence + wiring), user gate even in speed mode.
- The Monkey launches at Frame and Build. Storm reviews TDD. Non-negotiable.
- Sentinel writes acceptance contracts (ATDD) before per-task contracts.
- Sentinel is still a separate agent from Shipwright.
- Fix pipeline: Storm specs → Sentinel tests → Shipwright patches (finder never fixes).
- Consolidated findings report with `[concept]` location contract.
- Worktree isolation stays.
- Plan is still a hard gate. No plan = no build.
- Tests still run. Code still passes before shipping.
- Error handling is the same — merge conflicts, test failures, and typecheck errors still stop the loop.
- Run archiving is the same — `current/` → `run-NNNN-feature-name/` on completion.

## Step 0: Load Project Values

Same as `/insight-devloop` Step 0. Read `VALUES.md` and `TDD-MATRIX.md`. Paste content into agent briefs. If they don't exist, omit values-related lines from briefs. The Monkey reads VALUES.md herself.

Read each crew SKILL.md right before briefing that crew member (same progressive loading as devloop). Same crew, same identities, same methods. Speed mode changes ceremony, not crew definitions.

### Brief Construction Rules

Same three rules as `/insight-devloop`:
1. **Paste SKILL.md verbatim.** Entire file content — not selected sections, not paraphrased.
2. **Write context to a brief file.** `.insightsLoop/current/brief-<crew>.md` (or `brief-<crew>-<mode>.md` for multi-mode crew). One read instruction in the Agent prompt.
3. **Present crew output as-is.** No rewriting, narrating, or summarizing.

Brief naming and discard rules are identical to devloop. All `brief-*.md` files are on the archive discard list.

Also read `.insightsLoop/config.md` for engine tunables if it exists. If it doesn't exist, use these defaults:
- `monkey_findings_per_step` (default: 3) — applies **per vertical**. With 5 verticals, the Monkey produces 15 findings (3 × 5)
- `confidence_threshold` (default: 80) — filtering cutoff for Storm, Cartographer, and Monkey findings
- `theme` (default: none) — immersive crew theme

**Monkey brief template:** Use the same template as devloop at `.claude/skills/insight-devloop/reference/monkey-brief-template.md`. `monkey_findings_per_step` applies per vertical (default: 3). Tell the Monkey: "Produce {N} findings per vertical, each using a different technique."

**Theme loading:** Same as devloop — if `config.md` has a theme set (not `none`), load `.insightsLoop/themes/{setting}.md`. See devloop SKILL.md "Theme Loading" section for the full rules and the themed/never-themed boundary. Key points:
- Orchestrator voice is MANDATORY — print themed status messages at every step transition
- Artifact headers get themed, artifact content stays plain
- Crew output is never themed — findings tables, severity, confidence are always parseable
- The ship speaks themed, the crew speaks plain

## Artifact Directory

Same as `/insight-devloop` — all artifacts in `.insightsLoop/current/` during the run, archived to `run-NNNN-feature-name/` on completion. One additional artifact:

- `filtered-findings.md` — findings below 80 confidence, kept in archive for retro evaluation

## Prerequisites

Same as `/insight-devloop` — `plan.md` with `## Challenge` section must exist.

## Step 1: Frame (Auto-Triage)

### Greenfield Detection

Same two-pass detection as `/insight-devloop`:
- **Pass 1:** File existence — stack-agnostic (dependency manifest, framework entry point, framework config)
- **Pass 2:** Wiring verification (real content in entry point, dependencies declared, config connects to source)

If greenfield/partially-scaffolded: use `AskUserQuestion` even in speed mode — scaffolding correctness is not auto-approvable. Generate checklist, write to `.insightsLoop/current/scaffolding-checklist.md`. Sentinel receives it in her brief.

### Triage

Read `plan.md`. Determine triage from `## Challenge` section:

| Size | Criteria | What runs | Approval |
|------|----------|-----------|----------|
| Small | 1 file, no new interfaces, existing patterns | Build → Ship (skip normalize) | Auto |
| Medium | Multi-file, existing patterns | Build → Ship (skip normalize) | Auto |
| Architectural | New interfaces, schema changes, public API | Full loop | **Wait for human** |

Write `.insightsLoop/current/frame.md` with triage label and task parallelization plan.

For small/medium: log the triage decision and proceed immediately.
For architectural: use the `AskUserQuestion` tool to present the frame and get approval. Options: "Approve — start building", "Adjust — change triage or scope", "Abort — back to plan".

### The Monkey at Frame (All Verticals)

Launch the Monkey agent. Same brief as `/insight-devloop` — covers all relevant verticals against the plan (Architecture, Data, Security, Integration, Operational). One finding per selected vertical. See devloop for vertical selection rules and brief template.

Output: `.insightsLoop/current/monkey-frame.md`

**IMPORTANT: Write `monkey-frame.md` immediately** after the Monkey agent returns. Agent output alone is not persistent — if you don't write the file, the archive loses the artifact.

If any finding has `Survived: no`:
- For architectural: stop and discuss (same as /insight-devloop)
- For small/medium: if the finding would change the triage, re-triage even in speed mode (triage correctness is not optional). Otherwise log to `filtered-findings.md` and proceed.

## Step 2: Build

Same as `/insight-devloop`. No shortcuts at Build — this is where correctness lives.

### 2a: TDD — The Sentinel (Opus)

Same as `/insight-devloop`. Read the Sentinel's SKILL.md, paste verbatim. Write context to `.insightsLoop/current/brief-sentinel.md` per devloop Step 2a (includes Acceptance Criteria and Scaffolding Checklist if greenfield).

### Storm — TDD Review (Opus)

Same as `/insight-devloop` — Storm reviews the Sentinel's test contracts for gaps. Read Storm SKILL.md, paste verbatim, write context to `.insightsLoop/current/brief-storm-tdd.md` per devloop Step 2a.

Output: `.insightsLoop/current/storm-tdd.md`

**IMPORTANT: Write `storm-tdd.md` immediately** after the Storm agent returns. Agent output alone is not persistent — if you don't write the file, the archive loses the artifact.

If any finding is critical/high (missing acceptance criteria coverage): **dispatch to the Sentinel** — re-invoke her to write the missing contracts. In speed mode, Sentinel dispatch happens without a user gate — the contracts get added automatically. Lower-severity findings log to `filtered-findings.md`.

### 2b: Implement — The Shipwright (Sonnet, parallel worktrees)

Same as `/insight-devloop`. Read the Shipwright's SKILL.md, paste verbatim. Write context to `.insightsLoop/current/brief-shipwright.md` per devloop Step 2b.

**Note:** The Build Monkey runs after Storm + Cartographer in Step 3b, with full analysis context. See "Build Monkey (all verticals)" below.

## Step 3: Ship (Filtered)

### 3a: Merge

Same as `/insight-devloop`. Conflicts still stop the loop and go to the user.

### 3b: Verify + Converge (confidence-filtered)

**Three agents run on the merged diff. Storm and Cartographer run in parallel first, then the Build Monkey runs after both return. Then converge and present.**

#### Storm + Cartographer (parallel)

**The Storm (Opus)**: Read the Storm's SKILL.md at `.claude/skills/insight-storm/SKILL.md`, paste verbatim. Write context to `.insightsLoop/current/brief-storm-verify.md` per devloop Step 3b. Add one instruction to the brief: "For each finding, assign a confidence score (0-100) based on how certain you are this is a real issue, not a theoretical concern. Add a Confidence column to all tables." The Storm handles both adversarial review and consistency in a single pass.

**The Cartographer (Sonnet)**: Launch as an Agent (same as devloop — paste SKILL.md verbatim, write context to `brief-cartographer.md`). Add one instruction to the brief: "For each finding, add a Confidence column (0-100) based on how certain you are this path is actually reachable and unguarded." Skip condition same as devloop.

**Skip condition:** If the story is visual-only (layout, CSS, copy changes) with no new code paths, skip the Cartographer entirely. Mechanical path enumeration adds nothing when no branches exist to enumerate — Storm carries verification alone. Write an empty `edge-cases.md` (header only) for the archive and note "Skipped: visual-only change" at the top.

**IMPORTANT: Write both `storm-report.md` and `edge-cases.md` immediately** after each agent returns. Agent output alone is not persistent.

Storm output: `.insightsLoop/current/storm-report.md`:

```markdown
# Storm Report

| Location | Issue | Severity | Confidence | Suggestion |
|----------|-------|----------|------------|------------|
| `src/lib/auth.ts:45` | Token skips issuer check | critical | 90 | Add issuer verification |
```

Cartographer output: `.insightsLoop/current/edge-cases.md` — same format with Confidence column.

**Filtering (applied during convergence, not here):**
- Findings with confidence 80+ → shown to user, fixed if critical/high
- Findings with confidence <80 → appended to `.insightsLoop/current/filtered-findings.md`
- Empty reports remain valid
- Borderline (threshold-5 to threshold-1): round up, show it. Better to over-surface than to miss.

#### Build Monkey (all verticals — after Storm + Cartographer)

Same as `/insight-devloop` — single Monkey covers all relevant verticals (Architecture, Data, Security, Integration, Operational) in one pass. Receives: merged diff + storm-report + edge-cases + all vertical lenses.

Output: `.insightsLoop/current/monkey-build.md`

**IMPORTANT: Write `monkey-build.md` immediately** after the Monkey agent returns.

**Vertical selection:** Same as devloop — skip irrelevant verticals based on plan. Always run Architecture and Integration.

**Confidence filter applies per finding:** 80+ surfaced, below-threshold → `filtered-findings.md`. Findings with `Survived: no`, high confidence, and actionable file:line enter consolidated findings for fix pipeline.

#### Converge and Present

**This is a hard gate even in speed mode. Do not proceed to 3c without completing this.**

After all agents return (Storm, Cartographer, Build Monkey) and their artifacts are written to disk:

1. Apply confidence filtering: 80+ findings surfaced, below-threshold → `filtered-findings.md`
2. Present a summary of ALL surfaced findings to the user:
   - Storm: [N] findings above threshold ([severity breakdown])
   - Cartographer: [N] findings above threshold (or "skipped — visual only")
   - Build Monkey: [N] findings across [M] verticals, [X] surfaced, [Y] filtered
   - Filtered: [N] total findings sent to filtered-findings.md
3. Use `AskUserQuestion`: "Verify step complete. [N] findings surfaced, [M] filtered. Proceed to consolidate and fix?" Options: "Proceed to fix pipeline / Discuss findings first / Stop — need to rethink"

### 3c: Consolidate + Fix Pipeline (Confidence-Filtered)

**Step 1: Consolidate all findings** into `.insightsLoop/current/findings-consolidated.md` — same format as devloop (Source, Phase, Location, Issue, Severity, Status columns). Include Confidence column from Storm/Cartographer. Monkey findings use their own confidence scale.

**Location column contract:** Same as devloop — `file.ts:33` for actionable, `[concept]` prefix for conceptual (straight to Backlog).

**Step 2: Triage using the fix dispatch matrix (same as devloop).** Additional filter for speed mode: only 80+ confidence findings enter the pipeline. Below-threshold → `filtered-findings.md`.

### Findings Dispatch Matrix (Monkey + Storm TDD)

Same as devloop — findings are dispatched to the right crew member, not handled by the orchestrator. In speed mode, Storm TDD dispatch (Sentinel) skips the user gate.

| Source | Step | Finding Type | Dispatched To | Speed Mode Behavior |
|---|---|---|---|---|
| Monkey | Frame | Scope/triage challenge | Orchestrator (frame.md is not code) | Auto if doesn't change triage, gate if it does |
| Monkey | Frame | Conceptual finding | Backlog | Logged in monkey-frame.md |
| Storm | TDD | Missing test contract | **Sentinel** (re-invoke) | Auto-dispatch, no user gate |
| Storm | TDD | Over-testing / wrong abstraction | `filtered-findings.md` | Logged, not auto-fixed in speed mode |
| Monkey | Build | Any finding with file:line, 80+ confidence | Enters consolidated findings | Goes through fix dispatch matrix below |
| Monkey | Build | Below 80 confidence or conceptual | `filtered-findings.md` / Backlog | Logged, not auto-fixed |

### Fix Dispatch Matrix

**The orchestrator NEVER writes, edits, or patches code. All fixes go through crew agents.**

Same matrix as `/insight-devloop`:

| Finding Type | Route | Who Specs | Who Tests | Who Fixes |
|---|---|---|---|---|
| Storm critical/high (has file:line, 80+ confidence) | Full pipeline | Storm (Fix Spec) | Sentinel (regression test) | Shipwright (patch) |
| Storm consistency — assumption mismatch (80+) | Full pipeline | Storm (Fix Spec) | Sentinel (regression test) | Shipwright (patch) |
| Storm consistency — naming only (80+) | Shipwright-direct | N/A | N/A | Shipwright (rename) |
| Cartographer — data corruption/crash (80+) | Full pipeline | Storm (Fix Spec) | Sentinel (regression test) | Shipwright (patch) |
| Monkey `Survived: no`, high confidence, has file:line | Full pipeline | Storm (Fix Spec) | Sentinel (regression test) | Shipwright (patch) |
| Below 80 confidence | filtered-findings.md | — | — | — |
| `[concept]` or low severity | Backlog | — | — | — |

**Step 3: Fix pipeline** — same two routes as devloop:

**Full pipeline (3 agents, sequential):**
1. **Storm Fix Spec Mode** — paste Storm SKILL.md verbatim, write context to `brief-storm-fixspec.md` with triaged findings
2. **Sentinel regression tests** — paste Sentinel SKILL.md verbatim, write context to `brief-sentinel-fix.md` with fix specs
3. **Shipwright patches** — paste Shipwright SKILL.md verbatim, write context to `brief-shipwright-fix.md` with fix specs + failing tests

**Shipwright-direct (naming/renames):**
- Shipwright receives Storm consistency table with canonical forms, applies renames, runs existing tests

User gate: "Fix pipeline patched N findings. Approve?" Max 2 attempts per finding.

**Step 4: Update consolidated report** status column.

### 3d: Verify clean

Run full test suite + typecheck.

## Step 4: Done

Same as `/insight-devloop` — write `summary.md`, archive the run. One addition to summary:

```markdown
## Filtering
- Surfaced: [X findings]
- Filtered: [Y findings → filtered-findings.md]
- Monkey: [X challenges across 2 steps (Frame + Build), Y survived, Z didn't]
- Storm TDD: [X test gaps found]
```

**Archive keeps extra files:** `filtered-findings.md`, `findings-consolidated.md`, `fix-specs.md`, `scaffolding-checklist.md`, `storm-plan.md`, `storm-tdd.md`, and `mockup.html` (all if exists) are preserved in the run directory alongside the standard archive set (summary, plan, monkey-frame, monkey-build, storm-report). Discard: `frame.md`, `edge-cases.md`, `brief-*.md`.

## Model Assignment

Same as `/insight-devloop`. Monkey is Opus.

## User Gates

Every decision point that requires user input MUST use the `AskUserQuestion` tool. Never present a decision as plain text — the user may not realize you're waiting. Plain text looks like the agent is still working. `AskUserQuestion` makes it unmistakable.

Speed mode reduces gates but doesn't eliminate them. The ones that remain are non-negotiable.

**Mandatory gates (always use `AskUserQuestion`):**

| When | Gate | Options |
|------|------|---------|
| Step 1: Frame (architectural only) | Approve triage and scope | Approve / Adjust / Abort |
| Step 1: Monkey would change triage | Monkey says the size is wrong | Re-triage / Override / Abort |
| Step 3a: Merge conflict | Files overlap between worktrees | Show both versions, user picks |
| Step 3b: Converge (after Storm + Cartographer + Build Monkey) | Present all surfaced findings before fix pipeline | Proceed to fix pipeline / Discuss findings first / Stop |
| Step 3d: After fixes + verify clean | Confirm shippable before archive | Ship / Fix more / Abort |

**Not gated in speed mode** (auto-proceed, logged):
- Frame approval for small/medium (auto-approved, logged)
- Monkey `Survived: no` below confidence threshold (logged to filtered-findings.md)
- Storm TDD findings below critical/high (auto-dispatch to Sentinel or logged)

## Rules

- **Every user gate uses `AskUserQuestion`.** This is how the user knows you need them. No exceptions. If you're waiting for input, use the tool.
- **The Monkey runs at Frame and Build.** Storm handles TDD review. Each agent at its strength.
- **Monkey and Storm TDD findings use the same filter.** 80+ confidence or it goes to filtered-findings.md.
- **One exception: triage correction.** If the Monkey's Frame finding would change the triage size, act on it even if confidence is below 80. Getting the triage wrong cascades through every step.
- **Sentinel and Shipwright are never the same agent.**
- **The orchestrator NEVER writes code.** Not one line. Not a rename. Not a "quick fix." All code changes go through crew agents via the fix dispatch matrix. The orchestrator triages, dispatches, and presents — it does not edit files.
- **Always use worktree isolation.**
- **Plan is a hard gate.**
- **Filtered findings are never deleted.** `filtered-findings.md` survives into the archived run. The user and `/insight-retro` can review it.
- **Architectural changes always gate.** If triage says architectural, this skill behaves exactly like `/insight-devloop`.
- **Archive runs, don't delete.** Same as devloop.
- **Same error handling as /insight-devloop.** Merge conflicts, test failures, and typecheck errors still stop the loop. Speed mode doesn't mean reckless mode.
