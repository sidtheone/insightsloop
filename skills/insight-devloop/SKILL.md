---
name: insight-devloop
description: "4-step build loop for human+AI teams. Consumes plan.md (with Challenge section) from /insight-plan, then executes: Frame (triage) → Build (TDD + parallel worktrees) → Ship (merge + normalize + verify). Use after /plan produces artifacts, or for any scoped task ready to build. Trigger on: 'build this', 'execute the plan', 'run devloop', 'start building', or when plan.md exists and user wants to proceed."
model: opus
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx jest*), Bash(npx tsc*), Bash(git *), Agent, Skill(frontend-design), AskUserQuestion
argument-hint: "[path-to-plan.md]"
---

# DevLoop — The Crew

A 4-step build loop: Frame → Build → Ship → Done. Each step has crew, each produces artifacts for the next.

## The Crew

| Role | Persona | Model | Output |
|------|---------|-------|--------|
| Decomposition | **The Quartermaster** | Opus | `frame.md` |
| TDD | **The Sentinel** | Opus | Failing test suite |
| Builder | **The Shipwright** | Sonnet | Passing implementation in worktree |
| Adversarial + Consistency | **The Storm** | Opus | `storm-report.md`, `storm-tdd.md` |
| Edge Cases | **The Cartographer** | Sonnet | `edge-cases.md` |
| Chaos | **The Monkey** | Opus | `monkey-frame.md`, `monkey-build.md` |
| Retro | **The Lookout** | Sonnet | Crew round + learnings (separate skill) |

### Lean Crew (Small triage)

| Agent | Lean (Small) | Full (Medium+) |
|-------|-------------|----------------|
| Monkey Frame | Yes | Yes |
| Sentinel | Yes | Yes |
| Storm TDD | Yes | Yes |
| Shipwright | Yes | Yes |
| Storm Verify | Yes | Yes |
| Cartographer | **No** | Yes |
| Build Monkey | **No** | Yes |

Gate: `Triage: Small. Lean crew. Approve / Full crew / Adjust / Abort`

After plan correction (§ Quartermaster correction mode), re-evaluate triage. If Small→Medium, escalate to Full. Convergence gate states what was skipped, nudges retro.

## Step 0: Load Project Values

Read `VALUES.md` and `TDD-MATRIX.md` at repo root if they exist. Read `.insightsLoop/config.md` for engine tunables (defaults: `monkey_findings_per_step: 3` per vertical, `confidence_threshold: 80`).

When constructing Monkey briefs: substitute `[N]` in templates with `monkey_findings_per_step` from config. Tell the Monkey: "Produce {N} findings per vertical, each using a different technique."

Read each crew SKILL.md **right before briefing that crew member** — not all upfront:
- `.claude/skills/insight-quartermaster/SKILL.md` — before Step 1
- `.claude/skills/insight-sentinel/SKILL.md` — before Step 2a
- `.claude/skills/insight-storm/SKILL.md` — before Step 2a (TDD Review)
- `.claude/skills/insight-shipwright/SKILL.md` — before Step 2b
- `.claude/skills/insight-storm/SKILL.md` — re-read before Step 3b
- `.claude/skills/insight-edge-case-hunter/SKILL.md` — before Step 3b

### Briefing

**Paste SKILL.md verbatim into the Agent prompt** — the entire file, not selected sections. Then add one line: "Read `.insightsLoop/current/brief-<crew>.md` for your mission context." The SKILL.md is the agent's identity; the brief is the run-specific context.

Fill template from `brief-templates/`. Write brief to `.insightsLoop/current/brief-<crew>.md`. For parallel Shipwrights, number them: `brief-shipwright-1.md`, `brief-shipwright-2.md`. Present crew output as-is — do not rewrite or narrate. All `brief-*.md` files are on the archive discard list.

**No VALUES_MD slot** in templates — agents read VALUES.md themselves.

### Artifact Persistence

**Write artifacts to disk immediately** after each agent returns. Agent output alone is not persistent — if you don't write the file, the archive loses the artifact. This applies to: `monkey-frame.md`, `storm-tdd.md`, `storm-report.md`, `edge-cases.md`, `monkey-build.md`.

## Step 0.5: Resume Check

If `.insightsLoop/current/` has artifacts, ask: **Resume** (skip steps whose output exists) / **Start fresh** (archive, begin new) / **Abort**.

Gates always re-run on resume (Sentinel gate, user approvals). Natural idempotency handles the rest.

## Artifact Directory

```
.insightsLoop/
├── current/                  ← active run (create if doesn't exist)
│   ├── plan.md, frame.md, monkey-frame.md, storm-tdd.md
│   ├── monkey-build.md, storm-report.md, edge-cases.md
│   └── brief-*.md (ephemeral)
└── run-NNNN-feature-name/    ← archived run
```

**Keep:** summary.md, plan.md, monkey-frame.md, monkey-build.md, storm-tdd.md, storm-report.md, storm-plan.md, findings-consolidated.md, fix-specs.md, scaffolding-checklist.md, mockup.html (all if exists).
**Discard:** frame.md, edge-cases.md, brief-*.md.

## Prerequisites

plan.md with `## Challenge` required. Search: `$ARGUMENTS` → `.insightsLoop/current/plan.md` → repo root `plan.md`. No plan = no build. No Challenge section = incomplete plan. Both are hard gates. Normalize plan.md into `.insightsLoop/current/` before proceeding.

## Definitions

- **"Task"** = unit of work for one Shipwright in one worktree.
- **"Done"** = step's output artifact is produced and next step can consume it.

## Monkey Scope Rules (Frame)

**What IS a Frame finding:** impossible requirements, hard dependencies on unreliable things, missing shared contracts between parallel worktrees, silent assumptions between components, design decisions that lock you into expensive paths.

**What is NOT a Frame finding:** naming conventions, missing input validation, standard security hygiene, "this component should be inlined," anything that imagines what code will look like. Storm catches these on real code.

### Verticals

| Vertical | Lens | Best Techniques |
|---|---|---|
| **Architecture** | Coupling, abstractions, dependency direction, YAGNI violations, unnecessary layers | Existence Question, Assumption Flip, Delete Probe |
| **Data** | Queries, N+1, missing indexes, partial state, transactions, migration safety | Scale Shift, Time Travel, Hostile Input |
| **Security** | Auth gaps, injection, validation, secrets, privilege escalation | Hostile Input, Assumption Flip, Requirement Inversion |
| **Integration** | Cross-module seams, naming mismatches, assumption conflicts, API drift | Cross-Seam Probe, Assumption Flip, Scale Shift |
| **Operational** | 3am failures, monitoring, recovery, deploy safety, config drift | Time Travel, Scale Shift, Requirement Inversion |

**Vertical selection:** The orchestrator selects relevant verticals based on the plan:
- Pure UI story → skip Data, Security (unless auth-related)
- API-only story → skip Operational (unless deployment changes)
- Always run Architecture and Integration
- When in doubt, include all 5

---

## Step 1: Frame

The orchestrator does NOT decompose the plan itself. The Quartermaster does. The orchestrator invokes, presents, gates.

```
1a: Quartermaster(template:quartermaster) → frame.md
1b: Monkey(template:monkey-frame, scope:plan-level) → monkey-frame.md
    Impact tags: orchestrator sorts by breaks-build → values-gap → nice-to-have
1c: Gate — Approve / Adjust / Abort
    Survived:no → highlight, re-scope
    Adjust → Quartermaster(template:quartermaster-correction, selected findings from monkey-frame.md)
    Re-evaluate triage after correction. No Monkey re-run.
```

**1a:** The orchestrator does NOT modify frame.md. It is the Quartermaster's artifact. If changes needed, re-invoke the Quartermaster.

**1b — Dedup:** If `.insightsLoop/current/monkey-plan.md` exists (from Navigator), include its findings in "Previous Monkey findings" so the Frame Monkey doesn't repeat them.

**1c — Gate wording:** "Frame and Monkey review complete. [N tasks, M worktrees, parallelization shape]. [Monkey summary]. Approve / Adjust / Abort." If adjust: re-invoke the Quartermaster with feedback. Do NOT manually edit frame.md.

**SELECTED_FINDINGS:** Orchestrator reads full detail from `monkey-frame.md` for user-selected finding numbers. Not from summary return.

## Sentinel Gate

Three checks before Step 2a, every run (including resume):

> Manifest exists? Lock file exists? Test framework installed? Any fail (non-greenfield): stop. Greenfield: Task 0 must have run.

## Step 2: Build

```
2a: Sentinel(template:sentinel) → test files
    Storm TDD(template:storm-tdd) → storm-tdd.md
    critical/high → Gate → re-invoke Sentinel
2b: Shipwright(template:shipwright, worktree, isolation:"worktree") × N
    independent ∥, dependent →
    Task 0 (greenfield): Shipwright(template:shipwright-scaffold) in main dir before Sentinel gate
```

**2a:** The Sentinel must be a separate agent from the builder. If Storm TDD finds critical/high gaps: dispatch to the Sentinel to write missing contracts — the orchestrator does NOT write tests itself.

**2b:** Each Shipwright runs in an isolated worktree (`isolation: "worktree"`). Independent tasks in parallel, dependent tasks sequential per frame.md parallelization plan.

## Step 3: Ship

```
3a: Merge worktrees → main (never auto-resolve)
3b: Storm(template:storm-verify) ∥ Cartographer(template:cartographer)
    → Build Monkey(template:monkey-build)
    Gate: "Storm:[N] Cart:[N] Monkey:[N]. Fix / Discuss / Stop"
    Lean gate: "Storm:[N]. Fix / Discuss / Stop" (Cart + Monkey skipped)
    Normalize at consolidation: impact tags → severity
      breaks-build → critical/high, values-gap → medium, nice-to-have → low
3c: Consolidate → sort(severity) → triage(matrix) → Gate
    full:   Storm(spec, inline brief) → Sentinel(test, inline brief) → Shipwright(patch, inline brief)
    direct: Shipwright(rename)
    backlog: log, skip
    max 2/finding → backlog
    Note: fix pipeline briefs are inline — short, context-specific, no template needed
3d: tests + typecheck → all pass → shippable
```

### 3a: Merge Procedure

**Pre-merge check:** Only merge worktrees where the Shipwright completed successfully (all tests pass). Skip stopped worktrees. Present: "Merging: [list]. Skipped (stopped): [list]." If all stopped, loop back to user.

For each worktree:
1. Check which files were modified
2. No overlap with other worktrees → fast-forward merge
3. Files overlap → present conflict to user, never auto-resolve

### 3b: Verify + Converge

**Cartographer skip condition:** If the story is visual-only (layout, CSS, copy changes) with no new code paths, skip the Cartographer. Write empty `edge-cases.md` (header only) noting "Skipped: visual-only change."

**Build Monkey: Do not skip. Do not proceed to convergence without running.**

**This is a hard gate. Do not proceed to 3c without completing convergence.**

Present all findings: Storm: [N] introduced ([severity breakdown]), [N] consistency. Cartographer: [N] (or "skipped"). Monkey: [N] across [M] verticals, [X] survived, [Y] didn't. Gate: "Proceed to fix pipeline / Discuss / Stop"

**FINDINGS_BEFORE_SHIP** in storm-verify template = `monkey-frame.md` + `storm-tdd.md` only. Files from the same step (`monkey-build.md`, `edge-cases.md`) don't exist yet.

### 3c: Consolidate + Fix Pipeline

**Consolidated Findings** → `.insightsLoop/current/findings-consolidated.md`:

```markdown
| # | Source | Phase | Location | Issue | Severity | Status |
```

**Location:** `file.ts:33` = actionable (fix pipeline eligible). `[concept] description` = conceptual (straight to Backlog). Sort: severity desc, sub-sort by file + line. No auto-dedup — note "Possible dup of #N", user confirms.

**Triage gate:** "Consolidated findings: [N] total, [M] actionable. Triage: [N] full pipeline, [N] Shipwright-direct. Fix / Skip to backlog / Discuss"

#### Findings Dispatch (Monkey + Storm TDD)

| Source | Step | Finding Type | Dispatched To |
|---|---|---|---|
| Monkey | Frame | Scope/triage challenge | Orchestrator (frame.md is not code) |
| Monkey | Frame | Conceptual finding | Backlog |
| Storm | TDD | Missing test contract | **Sentinel** (re-invoke) |
| Storm | TDD | Over-testing / wrong abstraction | User decides |
| Monkey | Build | Finding with file:line | Enters consolidated findings → fix matrix |
| Monkey | Build | Conceptual finding | Backlog |

#### Fix Dispatch Matrix

The orchestrator NEVER writes code. Not one line. Not a rename.

| Finding Type | Route | Who Specs | Who Tests | Who Fixes |
|---|---|---|---|---|
| Storm critical/high (file:line) | Full pipeline | Storm (Fix Spec) | Sentinel (regression test) | Shipwright (patch) |
| Storm consistency — assumption mismatch | Full pipeline | Storm (Fix Spec) | Sentinel (regression test) | Shipwright (patch) |
| Storm consistency — naming only | Shipwright-direct | N/A | N/A | Shipwright (rename) |
| Cartographer — data corruption/crash | Full pipeline | Storm (Fix Spec) | Sentinel (regression test) | Shipwright (patch) |
| Monkey `Survived: no`, high confidence, file:line | Full pipeline | Storm (Fix Spec) | Sentinel (regression test) | Shipwright (patch) |
| Monkey `Survived: no`, low confidence or `[concept]` | Backlog | — | — | — |
| Dup of #N | Skip | — | — | — |

#### Full Pipeline (3 agents, sequential)

1. **Storm Fix Spec** → `.insightsLoop/current/fix-specs.md` — one spec per finding: regression test contract, fix location, fix intent, boundary (what NOT to touch). Does NOT write code or tests.
2. **Sentinel regression tests** — one test per fix spec. Each must fail before fix is applied.
3. **Shipwright patches** — minimum patches. Runs full suite. All tests pass — old and new.

**Shipwright-direct:** Receives Storm consistency table with canonical forms, applies renames. Existing tests must still pass.

**Fix gate:** "Fix pipeline patched [N] findings ([M] full, [K] rename). Approve?" Max 2 fix attempts per finding. If tests fail after fixes: stop, present to user.

**Update consolidated report** Status column: Fixed, Unresolved, Backlog, Dup of #N.

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
- Storm Verify: [X critical, Y high, Z medium, W low]
- Storm TDD: [X test gaps found]
- Cartographer: [X findings]
- Monkey (Frame): [X findings across Y verticals, Z survived]
- Monkey (Build): [X findings across Y verticals, Z survived]

## Decisions
[Any decisions made during the build]
```

Archive the run:
1. Determine next run number (look at existing `run-*` dirs)
2. Keep: summary.md, plan.md, monkey-frame.md, monkey-build.md, storm-tdd.md, storm-report.md, storm-plan.md, findings-consolidated.md, fix-specs.md, scaffolding-checklist.md, mockup.html (all if exists)
3. Delete: frame.md, edge-cases.md, brief-*.md
4. Rename `.insightsLoop/current/` → `.insightsLoop/run-NNNN-feature-name/`

Run naming: NNNN zero-padded sequential, feature-name from plan.md `# Plan: [Feature Name]` heading, lowercased and hyphenated.

Present summary. Suggest: run `/insight-retro` to capture learnings.

---

## Errors

```
Sentinel won't compile  → stop, loop to plan
Shipwright fails ×3     → stop worktree, show user
Merge conflict          → never auto-resolve, user picks
Pass in wt, fail merged → integration bug, check Monkey Frame
Typecheck fails         → check Storm Consistency
Fix causes regression   → show both, user decides (fix regression / revert + backlog / different approach)
```

## Model Assignment

| Role | Model | Why |
|------|-------|-----|
| TDD agent | Opus | Correlated failure protection needs strong contracts |
| Builder agents | Sonnet | Pattern-following, speed matters |
| Adversarial + Consistency | Opus | Must find real issues, not surface noise |
| Edge case hunter | Sonnet | Mechanical enumeration, method not judgment |
| Monkey | Opus | Chaos requires intelligence |

## User Gates

Every decision point uses `AskUserQuestion`. Never present a decision as plain text.

| When | Gate | Options |
|------|------|---------|
| Step 1c | Approve triage and parallelization | Approve / Adjust / Abort |
| Step 1c | Monkey `Survived: no` | Re-scope / Ignore / Abort |
| Step 2a | Storm TDD critical/high | Add contracts / Ignore / Rethink |
| Step 3a | Merge conflict | Show both, user picks |
| Step 3b | Converge (all agents done) | Fix pipeline / Discuss / Stop |
| Step 3d | After fixes + verify clean | Ship / Fix more / Abort |

## Rules

- Every user gate uses `AskUserQuestion`. No exceptions.
- Never run TDD and build in the same agent. Correlated failure is silent and deadly.
- The orchestrator NEVER writes code. Dispatch to crew via fix matrix.
- The Monkey is a real agent — brief, context, structured markdown back.
- Always use worktree isolation for parallel agents.
- Empty edge case report is valid.
- Human approves at Frame. Don't build without go-ahead.
- Plan is a hard gate. No plan.md = no build.
- Archive runs, don't delete. `current/` → `run-NNNN-feature-name/`.
- Stop condition: fix critical/high Storm, data-corruption/crash Cartographer, `Survived: no` high-confidence Monkey. Rest → backlog.
