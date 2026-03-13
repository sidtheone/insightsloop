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

Read each crew SKILL.md **right before briefing that crew member** — not all upfront:
- `.claude/skills/insight-quartermaster/SKILL.md` — before Step 1
- `.claude/skills/insight-sentinel/SKILL.md` — before Step 2a
- `.claude/skills/insight-storm/SKILL.md` — before Step 2a (TDD Review)
- `.claude/skills/insight-shipwright/SKILL.md` — before Step 2b
- `.claude/skills/insight-storm/SKILL.md` — re-read before Step 3b
- `.claude/skills/insight-edge-case-hunter/SKILL.md` — before Step 3b

### Briefing

Fill template from `brief-templates/`. Write brief to `.insightsLoop/current/brief-<crew>.md`. Pass to agent. Present crew output as-is — do not rewrite or narrate. All `brief-*.md` files are on the archive discard list.

**No VALUES_MD slot** in templates — agents read VALUES.md themselves.

## Step 0.5: Resume Check

If `.insightsLoop/current/` has artifacts, ask: **Resume** (skip steps whose output exists) / **Start fresh** (archive, begin new) / **Abort**.

Gates always re-run on resume (Sentinel gate, user approvals). Natural idempotency handles the rest.

## Artifact Directory

```
.insightsLoop/
├── current/                  ← active run
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

---

## Step 1: Frame

```
1a: Quartermaster(template:quartermaster) → frame.md
1b: Monkey(template:monkey-frame, scope:plan-level) → monkey-frame.md
    Impact tags: orchestrator sorts by breaks-build → values-gap → nice-to-have
1c: Gate — Approve / Adjust / Abort
    Survived:no → highlight, re-scope
    Adjust → Quartermaster(template:quartermaster-correction, selected findings from monkey-frame.md)
    Re-evaluate triage after correction. No Monkey re-run.
```

**SELECTED_FINDINGS:** Orchestrator reads full detail from `monkey-frame.md` for user-selected finding numbers. Not from summary return.

## Sentinel Gate

Three checks before Step 2a, every run (including resume):

> Manifest exists? Lock file exists? Test framework installed? Any fail (non-greenfield): stop. Greenfield: Task 0 must have run.

## Step 2: Build

```
2a: Sentinel(template:sentinel) → test files
    Storm TDD(template:storm-tdd) → storm-tdd.md
    critical/high → Gate → re-invoke Sentinel
2b: Shipwright(template:shipwright, worktree) × N
    independent ∥, dependent →
    Task 0 (greenfield): Shipwright(template:shipwright-scaffold) in main dir before Sentinel gate
```

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

**FINDINGS_BEFORE_SHIP** in storm-verify template = `monkey-frame.md` + `storm-tdd.md` only. Files from the same step (`monkey-build.md`, `edge-cases.md`) don't exist yet.

### Consolidated Findings Format

```markdown
| # | Source | Phase | Location | Issue | Severity | Status |
```

**Location:** `file.ts:33` = actionable (fix pipeline eligible). `[concept] description` = conceptual (straight to Backlog). Sort: severity desc, sub-sort by file + line. No auto-dedup — note "Possible dup of #N", user confirms.

### Fix Dispatch Matrix

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

## Step 4: Done

```
summary.md → archive(keep artifacts, discard briefs+frame+edge-cases)
→ run-NNNN-name/ → suggest /retro
```

Run naming: `run-NNNN-feature-name` — NNNN zero-padded sequential, feature-name from plan.md title.

---

## Errors

```
Sentinel won't compile  → stop, loop to plan
Shipwright fails ×3     → stop worktree, show user
Merge conflict          → never auto-resolve, user picks
Pass in wt, fail merged → integration bug, check Monkey Frame
Typecheck fails         → check Storm Consistency
Fix causes regression   → show both, user decides
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
