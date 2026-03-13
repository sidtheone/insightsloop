---
name: insight-devloopfast
description: "Speed mode build loop. Same crew, same Monkey, less ceremony. Auto-triages (no approval gate for small/medium), confidence-filters findings (80+ only). The Monkey never sleeps — she just doesn't block. Use when you trust the plan and want to ship fast. Trigger on: 'fast build', 'quick build', 'devloopfast', 'speed mode', 'just build it'."
model: opus
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx jest*), Bash(npx tsc*), Bash(git *), Agent, Skill(insight-edge-case-hunter), Skill(frontend-design), AskUserQuestion
---

# DevLoopFast — Speed Mode

Same crew, same values, same Monkey, less ceremony. This is `/insight-devloop` with two changes:

1. **Auto-triage** — Frame runs but doesn't wait for approval on small/medium changes. Only architectural changes gate on human approval.
2. **Confidence filtering** — Storm, Cartographer, and Monkey findings filtered at 80+ confidence. Below that, logged to `.insightsLoop/current/filtered-findings.md` (never discarded — just not in your face).

The Monkey is not ceremony. She's the immune system. She runs at every step as a real agent with structured output. The only difference from `/insight-devloop`: she doesn't block the loop. She produces her finding, it gets confidence-filtered like everything else, and the crew keeps moving.

## What's Different from /insight-devloop

| Aspect | /insight-devloop | /insight-devloopfast |
|--------|----------|--------------|
| Frame approval | Always waits | Auto-approves small/medium, gates architectural |
| Monkey | Real agent, blocks on `Survived: no` | Real agent, logs finding, moves on |
| Storm output | All findings | 80+ confidence only |
| Cartographer output | All findings | 80+ confidence only |
| Filtered findings | N/A | `filtered-findings.md` |

## What's NOT Different

- Phase 0: Values still load and get pasted into briefs. Non-negotiable.
- Brief construction: paste SKILL.md verbatim, write context to brief files, present output as-is.
- Greenfield detection: two-pass (existence + wiring), user gate even in speed mode.
- The Monkey launches as a real agent at every step. Non-negotiable.
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
- `monkey_findings_per_step` (default: 1) — if > 1, tell the Monkey to produce N findings per step, each using a different technique
- `confidence_threshold` (default: 80) — filtering cutoff for Storm, Cartographer, and Monkey findings
- `theme` (default: none) — immersive crew theme

**Monkey brief template:** Use the same template as devloop at `.claude/skills/insight-devloop/reference/monkey-brief-template.md`. If `monkey_findings_per_step` > 1, replace "Pick one technique" with "Produce {N} findings, each using a different technique."

**Theme loading:** Same as devloop — if `config.md` has a theme set (not `none`), load `.insightsLoop/themes/{setting}.md` and apply persona openers, step names, orchestrator voice, artifact headers, and vocabulary substitutions. See devloop SKILL.md "Theme Loading" section for full rules. Theme is voice only — never changes file paths, technique names, severity levels, or functional logic.

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

### The Monkey at Frame

Launch the Monkey agent. Same brief as `/insight-devloop`. She produces `.insightsLoop/current/monkey-frame.md`.

**IMPORTANT: Write `monkey-frame.md` immediately** after the Monkey agent returns. Agent output alone is not persistent — if you don't write the file, the next Monkey loses dedup context and the archive loses the artifact.

If `Survived: no`:
- For architectural: stop and discuss (same as /insight-devloop)
- For small/medium: if the finding would change the triage, re-triage even in speed mode (triage correctness is not optional). Otherwise log to `filtered-findings.md` and proceed.

## Step 2: Build

Same as `/insight-devloop`. No shortcuts at Build — this is where correctness lives.

### 2a: TDD — The Sentinel (Opus)

Same as `/insight-devloop`. Read the Sentinel's SKILL.md, paste verbatim. Write context to `.insightsLoop/current/brief-sentinel.md` per devloop Step 2a (includes Acceptance Criteria and Scaffolding Checklist if greenfield).

### The Monkey at TDD

Launch the Monkey agent (Opus). Same brief as `/insight-devloop` — with full arsenal (Assumption Flip, Hostile Input, Existence Question, Scale Shift, Time Travel, Cross-Seam Probe, Requirement Inversion, Delete Probe), step-specific technique recommendations, and previous Monkey findings accumulation. She produces `.insightsLoop/current/monkey-tdd.md`.

**IMPORTANT: Write `monkey-tdd.md` immediately** after the Monkey agent returns. Agent output alone is not persistent — if you don't write the file, the next Monkey loses dedup context and the archive loses the artifact.

If `Survived: no` and the finding is a concrete test case (not abstract): **dispatch to the Sentinel** — re-invoke her to write the missing contract. The orchestrator does NOT write the test itself. If abstract or low confidence, log to `filtered-findings.md`. In speed mode, Sentinel dispatch happens without a user gate — the test gets added automatically.

### 2b: Implement — The Shipwright (Sonnet, parallel worktrees)

Same as `/insight-devloop`. Read the Shipwright's SKILL.md, paste verbatim. Write context to `.insightsLoop/current/brief-shipwright.md` per devloop Step 2b.

### The Monkey at Build

Launch the Monkey agent (Opus). Same brief as `/insight-devloop` — with full arsenal, step-specific technique recommendations (Cross-Seam Probe, Time Travel, Scale Shift), and previous Monkey findings accumulation. She produces `.insightsLoop/current/monkey-build.md`.

**IMPORTANT: Write `monkey-build.md` immediately** after the Monkey agent returns. Agent output alone is not persistent — if you don't write the file, the next Monkey loses dedup context and the archive loses the artifact.

If `Survived: no` and confidence is high: **dispatch to the Storm** — invoke her on the specific seam. Storm reports back; if confirmed, the finding enters consolidated findings for the fix pipeline. If low confidence, log to `filtered-findings.md`. Proceed to merge regardless — but if the finding specifically identifies a naming mismatch between worktrees, flag it for the merge step so it gets resolved there.

## Step 3: Ship (Filtered)

### 3a: Merge

Same as `/insight-devloop`. Conflicts still stop the loop and go to the user.

### 3b: Verify + Converge (confidence-filtered)

**Three agents run on the merged diff. Storm and Cartographer run in parallel first, then the Ship Monkey runs after both return. Then converge and present.**

#### Storm + Cartographer (parallel)

**The Storm (Opus)**: Read the Storm's SKILL.md at `.claude/skills/insight-storm/SKILL.md`, paste verbatim. Write context to `.insightsLoop/current/brief-storm-verify.md` per devloop Step 3b. Add one instruction to the brief: "For each finding, assign a confidence score (0-100) based on how certain you are this is a real issue, not a theoretical concern. Add a Confidence column to all tables." The Storm handles both adversarial review and consistency in a single pass.

**The Cartographer (Sonnet)**: Invoke `/insight-edge-case-hunter` as the actual skill (use the Skill tool, not a general-purpose agent). Add one instruction: "For each finding, add a Confidence column (0-100) based on how certain you are this path is actually reachable and unguarded." Skip condition same as devloop.

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

#### Ship Monkey (after Storm + Cartographer)

**Do not skip. Do not proceed to convergence without running the Ship Monkey.**

Launch the Monkey agent (Opus). Same brief as `/insight-devloop` — with full arsenal, step-specific technique recommendations (Time Travel, Scale Shift, Hostile Input), and previous Monkey findings accumulation. She produces `.insightsLoop/current/monkey-ship.md`.

**IMPORTANT: Write `monkey-ship.md` immediately** after the Monkey agent returns. Agent output alone is not persistent — if you don't write the file, the archive loses the artifact.

Her finding goes through the same 80+ confidence filter. No special treatment. She earns attention like everyone else.

#### Converge and Present

**This is a hard gate even in speed mode. Do not proceed to 3c without completing this.**

After all three agents return and their artifacts are written to disk:

1. Apply confidence filtering: 80+ findings surfaced, below-threshold → `filtered-findings.md`
2. Present a summary of ALL surfaced findings to the user:
   - Storm: [N] findings above threshold ([severity breakdown])
   - Cartographer: [N] findings above threshold (or "skipped — visual only")
   - Ship Monkey: [technique used], Survived: [yes/no], Confidence: [score], [surfaced/filtered]
   - Filtered: [N] total findings sent to filtered-findings.md
3. Use `AskUserQuestion`: "Verify step complete. [N] findings surfaced, [M] filtered. Proceed to consolidate and fix?" Options: "Proceed to fix pipeline / Discuss findings first / Stop — need to rethink"

### 3c: Consolidate + Fix Pipeline (Confidence-Filtered)

**Step 1: Consolidate all findings** into `.insightsLoop/current/findings-consolidated.md` — same format as devloop (Source, Phase, Location, Issue, Severity, Status columns). Include Confidence column from Storm/Cartographer. Monkey findings use their own confidence scale.

**Location column contract:** Same as devloop — `file.ts:33` for actionable, `[concept]` prefix for conceptual (straight to Backlog).

**Step 2: Triage using the fix dispatch matrix (same as devloop).** Additional filter for speed mode: only 80+ confidence findings enter the pipeline. Below-threshold → `filtered-findings.md`.

### Monkey Findings Dispatch Matrix

Same as devloop — Monkey findings are dispatched to the right crew member, not handled by the orchestrator. In speed mode, TDD dispatch (Sentinel) skips the user gate.

| Monkey Step | Finding Type | Dispatched To | Speed Mode Behavior |
|---|---|---|---|
| Frame | Scope/triage challenge | Orchestrator (frame.md is not code) | Auto if doesn't change triage, gate if it does |
| TDD | Test blind spot | **Sentinel** (re-invoke) | Auto-dispatch, no user gate |
| Build | Integration seam | **Storm** (invoke on seam) | Only if high confidence, else filtered |
| Ship | Operational edge case | Consolidated findings | Goes through fix dispatch matrix below |

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
- Monkey: [X challenges across 4 steps, Y survived, Z didn't]
```

**Archive keeps extra files:** `filtered-findings.md`, `findings-consolidated.md`, `fix-specs.md`, `scaffolding-checklist.md`, `storm-plan.md`, and `mockup.html` (all if exists) are preserved in the run directory alongside the standard archive set (summary, plan, monkey-*, storm-report). Discard: `frame.md`, `edge-cases.md`, `brief-*.md`.

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
| Step 3b: Converge (after Storm + Cartographer + Ship Monkey) | Present all surfaced findings before fix pipeline | Proceed to fix pipeline / Discuss findings first / Stop |
| Step 3d: After fixes + verify clean | Confirm shippable before archive | Ship / Fix more / Abort |

**Not gated in speed mode** (auto-proceed, logged):
- Frame approval for small/medium (auto-approved, logged)
- Monkey `Survived: no` below confidence threshold (logged to filtered-findings.md)

## Rules

- **Every user gate uses `AskUserQuestion`.** This is how the user knows you need them. No exceptions. If you're waiting for input, use the tool.
- **The Monkey never sleeps.** She launches as a real agent at every step. Speed mode changes whether she blocks, not whether she exists.
- **Monkey findings use the same filter.** 80+ confidence or it goes to filtered-findings.md. She earns attention the same way the Storm does.
- **One exception: triage correction.** If the Monkey's Frame finding would change the triage size, act on it even if confidence is below 80. Getting the triage wrong cascades through every step.
- **Sentinel and Shipwright are never the same agent.**
- **The orchestrator NEVER writes code.** Not one line. Not a rename. Not a "quick fix." All code changes go through crew agents via the fix dispatch matrix. The orchestrator triages, dispatches, and presents — it does not edit files.
- **Always use worktree isolation.**
- **Plan is a hard gate.**
- **Filtered findings are never deleted.** `filtered-findings.md` survives into the archived run. The user and `/insight-retro` can review it.
- **Architectural changes always gate.** If triage says architectural, this skill behaves exactly like `/insight-devloop`.
- **Archive runs, don't delete.** Same as devloop.
- **Same error handling as /insight-devloop.** Merge conflicts, test failures, and typecheck errors still stop the loop. Speed mode doesn't mean reckless mode.
