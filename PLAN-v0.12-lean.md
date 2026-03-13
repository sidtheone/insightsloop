# DevLoop v0.12 — Lean Plan

8 changes. No new personas. No new systems.

---

## 1. Brief Templates

**Problem:** Orchestrator burns tokens writing briefs that are 90% copy-paste. L-008 violations (paraphrasing SKILL.md) happen because brief construction is generative.

**Fix:** 8 template files in `skills/insight-devloop/brief-templates/`. Each has `{{SLOT}}` placeholders filled by file reads.

**Templates:**

| File | Slots |
|------|-------|
| `quartermaster.md` | SKILL_MD, VALUES_MD, PLAN_MD |
| `sentinel.md` | SKILL_MD, VALUES_MD, PLAN_INTENT, PLAN_OUT_OF_SCOPE, PLAN_ARCHITECTURE, PLAN_TASKS, PLAN_KEY_FILES, SHARPENED_ACCEPTANCE_CRITERIA, TEST_FRAMEWORK_INFO, TDD_MATRIX_MD |
| `storm-tdd.md` | SKILL_MD, VALUES_MD, TEST_FILE_PATHS, SHARPENED_ACCEPTANCE_CRITERIA |
| `shipwright.md` | SKILL_MD, VALUES_MD, PLAN_ARCHITECTURE, TASK_ASSIGNMENT, FAILING_TEST_PATHS, VISUAL_SPEC |
| `monkey-frame.md` | SKILL_MD, VALUES_MD, PLAN_MD, FRAME_MD, PREVIOUS_FINDINGS, TRIAGE_LEVEL |
| `monkey-build.md` | SKILL_MD, VALUES_MD, MERGED_DIFF, MONKEY_FRAME_FINDINGS |
| `storm-verify.md` | SKILL_MD, VALUES_MD, MERGED_DIFF, ALL_PREVIOUS_FINDINGS |
| `cartographer.md` | SKILL_MD, VALUES_MD, CHANGED_FILE_PATHS, MERGED_DIFF |

**Slot resolution — all file reads, no LLM:**

| Slot | Source |
|------|--------|
| SKILL_MD | Read `skills/insight-{agent}/SKILL.md` |
| VALUES_MD | Read `VALUES.md` from project root |
| PLAN_MD | Read `.insightsLoop/current/plan.md` |
| PLAN_INTENT | Extract `## Intent` section from plan.md |
| PLAN_OUT_OF_SCOPE | Extract `## Out of Scope` section |
| PLAN_ARCHITECTURE | Extract `## Architecture` section |
| PLAN_TASKS | Extract `## Tasks` section |
| PLAN_KEY_FILES | Extract `## Key Files` section |
| SHARPENED_ACCEPTANCE_CRITERIA | Extract from `frame.md` |
| FRAME_MD | Read `frame.md` |
| TASK_ASSIGNMENT | Extract task block from frame.md by worktree ID |
| TEST_FRAMEWORK_INFO | Detect from project (jest.config / vitest.config) |
| TDD_MATRIX_MD | Read `TDD-MATRIX.md` (or empty) |
| TEST_FILE_PATHS | List test files written by Sentinel |
| FAILING_TEST_PATHS | Same as TEST_FILE_PATHS pre-implementation |
| VISUAL_SPEC | Read mockup path (or "none") |
| MERGED_DIFF | `git diff` on merged changes |
| CHANGED_FILE_PATHS | `git diff --name-only` |
| PREVIOUS_FINDINGS | Read all `monkey-*.md` + `storm-*.md` from current/ |
| MONKEY_FRAME_FINDINGS | Read `monkey-frame.md` |
| ALL_PREVIOUS_FINDINGS | Concatenate all findings files |
| TRIAGE_LEVEL | From frame.md triage field |

**Token nuance:** The orchestrator still reads files to fill slots — the read is transient, not accumulated in conversation. The savings come from: (a) no generative brief writing, (b) no interpretation or paraphrasing, (c) combined with summary returns (§2), agent output doesn't accumulate either.

**Devloop SKILL.md changes:**
- Replace Brief Construction Rules section (lines 44-58) with: "Read template from `brief-templates/{agent}.md`. Fill each `{{SLOT}}` by reading the source file. Write filled brief to `.insightsLoop/current/brief-{agent}.md`. Pass path to agent. Do not paraphrase, summarize, or interpret."
- Remove theme loading section (lines 67-78). Replace with: "If config.md has a theme set, adopt that voice in orchestrator messages between steps. One line, not a system."
- Update SKILL.md read timing (lines 36-42): "Read each SKILL.md to fill the `{{SKILL_MD}}` slot in the template, not into orchestrator context."

---

## 2. Summary Returns

**Problem:** Agents return 100-200 lines to orchestrator. By Ship step, ~1500 lines accumulated. Orchestrator never uses full detail — just routes.

**Fix:** Each crew SKILL.md gets one rule:

> "Return a structured summary to the orchestrator. For each finding: number, title, impact tag (breaks-build / values-gap / nice-to-have), confidence, target location, consequence (one sentence), impact (one sentence). Write full detail (technique, observation, guard snippets, survived) to the artifact file only."

**Return format:**

```
[N] findings across [M] verticals

#1 — [title] [impact-tag] confidence: [N]
     Target: [location]
     [consequence]
     [impact]

Written to [artifact].md
```

**Per-agent return shape:**

| Agent | Summary returns | Full detail to |
|-------|----------------|---------------|
| Quartermaster | Triage + task count + worktree count | frame.md |
| Monkey | Findings with impact/confidence/target/consequence | monkey-{step}.md |
| Sentinel | Test count + file list | test files |
| Storm | Findings with severity/confidence/target/consequence | storm-{mode}.md |
| Cartographer | Edge case count + unguarded paths | edge-cases.md |
| Shipwright | Pass/fail + test count | committed code |

**Orchestrator context by Ship:** ~175 lines of summaries instead of ~1500.

---

## 3. Resume Check

**Problem:** v0.11 run died at context. No way to pick up where it left off.

**Fix:** Add Step 0.5 to devloop (after Load Values, before Frame). Check `.insightsLoop/current/` for completion markers.

**State detection — completion markers, not artifact existence:**

Artifacts can exist mid-step (Storm TDD creates `storm-tdd.md` but Sentinel may still be correcting). Use `.done` files written after each step fully completes:

| Marker | Means | Resume from |
|--------|-------|-------------|
| Nothing | No active run | Start fresh |
| `step-0.done` | Values loaded | Step 1 (Frame) |
| `step-1.done` | Frame complete | Step 2 (Build) |
| `step-2a.done` | TDD complete (Sentinel + Storm TDD) | Step 2b (Shipwright) |
| `step-2b.done` | Build complete | Step 3 (Ship) |
| `step-3.done` | Ship complete | Nothing to resume |

**Gate:**

```
Active run detected. Last completed: step-2a (TDD).
- Resume → continues from Step 2b (Shipwright)
- Start fresh → archives current, begins new run
- Abort
```

**Rules:**
- If markers are inconsistent, warn and offer Start fresh only
- `.done` files are on the archive discard list (operational, not artifacts)
- Resume skips completed steps entirely
- Devloopfast gets the same logic

---

## 4. Lean Crew for Small

**Problem:** Small features get the full agent pipeline. Context fills before Ship.

**Fix:** Triage-aware crew selection. Small = Lean by default.

| Agent | Lean (Small) | Full (Medium+) |
|-------|-------------|----------------|
| Monkey at Frame | Yes | Yes |
| Sentinel | Yes | Yes |
| Storm TDD Review | Yes | Yes |
| Shipwright | Yes | Yes |
| Storm Verify | Yes | Yes |
| Cartographer | **No** | Yes |
| Build Monkey | **No** | Yes |

**Lean skips 2 agents.** This is an untested tradeoff. Implementation-level VALUES violations and exhaustive path enumeration are deferred to `/insight-retro` or manual review.

**Frame gate (Small only):**

```
Triage: Small. Lean crew.
- Approve
- Approve with full crew — adds Cartographer + Build Monkey
- Adjust
- Abort
```

Medium and Architectural always get full crew, no option shown.

**Convergence gate adapts:**

Full: "Storm: [N]. Cartographer: [N]. Monkey: [N]."
Lean: "Storm: [N]. (Cartographer + Build Monkey skipped — Lean.) Run /insight-retro after merge."

---

## 5. Shipwright: CLI for Deps

**Problem:** Agents hallucinate version numbers from training data.

**Fix:** Add to Shipwright SKILL.md:

> "Never write version numbers into manifest files. If you need a package: run `npm install <pkg>` (or ecosystem equivalent). For dev-only: `npm install -D <pkg>`. Check output for peer dependency warnings — if any, STOP and report. If CLI fails, STOP and report. You may add packages. You may never create or rewrite manifests."

One rule. Covers the Iron Rule without a new persona.

**Greenfield scaffolding:** The Shipwright already handles Task 0 from the Quartermaster's frame. This rule ensures Task 0 uses CLI commands, not hand-written package.json.

**Task 0 execution context:** Task 0 (scaffold) runs in the main working directory, not a worktree. Worktree isolation starts at Task 1. This ensures dependencies are visible to all subsequent worktrees.

**Ordering constraint:** For greenfield, Task 0 MUST complete before the Sentinel gate (§8). The orchestrator runs Task 0 between Frame approval and TDD — not during the parallel Build step.

```
Greenfield flow:
  Frame approved → Task 0 (Shipwright scaffolds in main dir)
    → Sentinel gate (manifest + lock + test fwk exist)
    → TDD (Sentinel + Storm)
    → Build (Shipwright worktrees for Tasks 1-N)
```

Non-greenfield: Task 0 doesn't exist. Sentinel gate runs immediately after Frame.

---

## 6. Quartermaster: Plan Correction Mode

**Problem:** Orchestrator edited plan.md after Monkey re-scope. That's interpretation, not routing.

**Fix:** Add to Quartermaster SKILL.md:

> "**Plan correction mode.** When invoked with selected Monkey findings, apply corrections to plan.md: update Architecture, Tasks, Acceptance Criteria, Key Files. Then re-decompose into updated frame.md. Do not add scope — only resolve the specific findings. If a finding requires a scope decision, present options and ask. Findings that were corrected in the plan update are marked 'resolved' in the Monkey artifact. Remaining findings carry forward as-is."

**Flow:**
1. Monkey runs at Frame → returns summary with impact tags
2. Orchestrator presents findings at re-scope gate (sorted by impact tag)
3. User selects which to apply
4. Orchestrator invokes Quartermaster in plan correction mode
5. Quartermaster corrects plan, re-decomposes frame
6. No Monkey re-run. Corrected findings → resolved. Rest → carry forward.

**Devloop SKILL.md change:** At Step 1c, add: "After re-scope selection, invoke Quartermaster in plan correction mode. Do not edit plan.md yourself."

---

## 7. Monkey: Impact Tags

**Problem:** 12 Monkey findings presented all-or-nothing. No way to prioritize without reading full detail.

**Fix:** Add to Monkey SKILL.md:

> "Tag each finding with an impact level: `breaks-build` (plan is broken, build will fail or produce wrong output), `values-gap` (VALUES violation, missing validation, coupling concern), or `nice-to-have` (edge case, documentation, cosmetic). The tag goes next to the confidence score in your output."

The orchestrator presents findings sorted by impact tag. User draws the line. No categorization system in the orchestrator.

---

## 8. Sentinel Gate

**Problem:** Sentinel creates infrastructure files (package.json, tsconfig) when they don't exist. Rule 4a blocks this, but a mechanical check is defense in depth.

**Fix:** Add to devloop SKILL.md before Step 2a:

```
Before invoking Sentinel, verify:
1. Dependency manifest exists (package.json / Cargo.toml / pyproject.toml)
2. Lock file exists (package-lock.json / Cargo.lock / poetry.lock)
3. Test framework installed (node_modules/.bin/jest or equivalent)

If ANY fails and this is NOT greenfield:
  "Dependencies missing. Install manually or check project setup."
  Do not proceed.

If greenfield: Task 0 has already run (§5 ordering constraint).
  If gate still fails: "Task 0 scaffold incomplete. Re-run or fix manually."
```

Three checks. No new system.

---

## Implementation

### Files to create (8 brief templates)

| File | ~Lines |
|------|--------|
| `skills/insight-devloop/brief-templates/quartermaster.md` | 10 |
| `skills/insight-devloop/brief-templates/sentinel.md` | 20 |
| `skills/insight-devloop/brief-templates/storm-tdd.md` | 12 |
| `skills/insight-devloop/brief-templates/shipwright.md` | 15 |
| `skills/insight-devloop/brief-templates/monkey-frame.md` | 15 |
| `skills/insight-devloop/brief-templates/monkey-build.md` | 12 |
| `skills/insight-devloop/brief-templates/storm-verify.md` | 12 |
| `skills/insight-devloop/brief-templates/cartographer.md` | 10 |

### Files to edit

| File | Changes |
|------|---------|
| `skills/insight-devloop/SKILL.md` | Replace brief construction rules with template instructions, remove theme loading (replace with one line), add resume check (Step 0.5), add Lean crew logic, add Sentinel gate, add greenfield Task 0 ordering, add Quartermaster plan correction invocation, add `.done` marker writes |
| `skills/insight-devloopfast/SKILL.md` | Same resume check + Sentinel gate + template instructions |
| `skills/insight-shipwright/SKILL.md` | Add CLI dep rule, Task 0 runs in main dir |
| `skills/insight-quartermaster/SKILL.md` | Add plan correction mode |
| `skills/insight-monkey/SKILL.md` | Add impact tag rule, add summary return rule |
| `skills/insight-storm/SKILL.md` | Add summary return rule |
| `skills/insight-edge-case-hunter/SKILL.md` | Add summary return rule |
| `skills/insight-sentinel/SKILL.md` | Already done (4a, 4b, 4c) |

### Order

1. Brief templates (standalone, no deps)
2. Summary return rules (one rule per SKILL.md, independent)
3. Shipwright CLI rule + Task 0 context (independent)
4. Quartermaster plan correction mode (independent)
5. Monkey impact tags (independent)
6. Devloop SKILL.md (depends on 1-5 being defined)
7. Devloopfast (mirrors devloop changes)

### Validation

Run a Small feature through devloop:

1. Brief files constructed from templates — no generative briefs
2. Agent summaries ≤30 lines each — orchestrator context stays lean
3. Resume check detects active run if interrupted
4. Lean crew auto-selected — Cartographer + Build Monkey skipped
5. Shipwright uses CLI for deps, never writes versions
6. Quartermaster applies plan corrections, not orchestrator
7. Monkey findings have impact tags
8. Sentinel gate passes (non-greenfield) or Task 0 ran first (greenfield)
9. Run completes without context death
