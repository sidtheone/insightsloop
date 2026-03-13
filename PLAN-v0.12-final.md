# DevLoop v0.12 — Final Plan

8 changes. Reviewed by Storm (values), Cartographer (interactions), blank agent (outside perspective). Trimmed three times.

---

## 1. Brief Templates

10 files in `skills/insight-devloop/brief-templates/`. `{{SLOT}}` placeholders filled by file reads. No slot resolution table — the template is the spec.

| File | Slots |
|------|-------|
| `quartermaster.md` | SKILL_MD, PLAN_MD |
| `quartermaster-correction.md` | SKILL_MD, PLAN_MD, SELECTED_FINDINGS, FRAME_MD |
| `sentinel.md` | SKILL_MD, PLAN_SECTIONS, SHARPENED_ACCEPTANCE_CRITERIA, TEST_FRAMEWORK_INFO, TDD_MATRIX_MD |
| `shipwright.md` | SKILL_MD, PLAN_ARCHITECTURE, TASK_ASSIGNMENT, FAILING_TEST_PATHS, VISUAL_SPEC |
| `shipwright-scaffold.md` | SKILL_MD, PLAN_ARCHITECTURE, SCAFFOLDING_CHECKLIST |
| `monkey-frame.md` | SKILL_MD, PLAN_MD, FRAME_MD, PREVIOUS_FINDINGS, TRIAGE_LEVEL |
| `monkey-build.md` | SKILL_MD, MERGED_DIFF, MONKEY_FRAME_FINDINGS |
| `storm-tdd.md` | SKILL_MD, TEST_FILE_PATHS, SHARPENED_ACCEPTANCE_CRITERIA |
| `storm-verify.md` | SKILL_MD, MERGED_DIFF, FINDINGS_BEFORE_SHIP |
| `cartographer.md` | SKILL_MD, CHANGED_FILE_PATHS, MERGED_DIFF |

**No VALUES_MD slot.** Agents read VALUES.md themselves.

**SELECTED_FINDINGS** = orchestrator reads full detail from `monkey-frame.md` for user-selected finding numbers. Not from summary return.

**FINDINGS_BEFORE_SHIP** = `monkey-frame.md` + `storm-tdd.md` only. Files produced in the same step (`monkey-build.md`, `edge-cases.md`) don't exist yet.

---

## 2. Summary Returns

One rule per crew SKILL.md:

> "Write full detail to artifact file before returning. Return structured summary to orchestrator. Per finding: number, title, impact tag, confidence, target, consequence, impact. Orchestrator receives summary only — it does NOT rewrite the artifact. Artifact format unchanged."

```
[N] findings across [M] verticals

#1 — [title] [impact-tag] confidence: [N]
     Target: [location]
     [consequence]
     [impact]

Written to [artifact].md
```

---

## 3. Resume Check

Step 0.5. Simple artifact detection — no `.done` files.

> If `current/` has artifacts, ask: Resume (skip steps whose output exists) / Start fresh (archive, begin new) / Abort.

Gates always re-run on resume (Sentinel gate, user approvals). Natural idempotency handles the rest.

---

## 4. Lean Crew for Small

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

After plan correction (§6), re-evaluate triage. If Small→Medium, escalate to Full.

Convergence gate states what was skipped, nudges retro.

---

## 5. Shipwright: CLI for Deps

One rule in Shipwright SKILL.md:

> "Never write version numbers. Need a package? Use the ecosystem's CLI add command (`npm install`, `cargo add`, `poetry add`, etc.). Dev-only? Use the dev flag (`-D`, `--dev`, `--group dev`). Dependency warnings? Log them, continue, flag in summary. Dependency errors (install fails)? STOP. CLI fails (network, permissions)? STOP. You may add via CLI. You may never create or rewrite manifests."

Greenfield: Task 0 runs in main dir before Sentinel gate. Scaffolding checklist is the contract, not tests. Worktrees start at Task 1. If Sentinel gate fails on resume, re-invoke Task 0.

---

## 6. Quartermaster: Plan Correction Mode

One addition to Quartermaster SKILL.md:

> "**Plan correction mode.** Apply corrections from selected Monkey findings. Content changes only — preserve heading structure. Re-decompose into updated frame.md. Track which findings were resolved in frame.md. Do not edit Monkey artifacts. Do not add scope. If scope decision needed, ask."

Flow:
```
Monkey returns summary → orchestrator sorts by impact tag
→ user selects at re-scope gate
→ orchestrator reads full findings from monkey-frame.md
→ Quartermaster corrects plan + re-decomposes
→ re-evaluate triage → no Monkey re-run
```

**Accepted risk:** Monkey does not re-run on corrected plan. Corrections are scoped to approved findings. If a correction introduces a new issue, Storm Verify catches it at Ship on real code.

---

## 7. Monkey: Impact Tags

One rule in Monkey SKILL.md:

> "Tag each finding: `breaks-build` / `values-gap` / `nice-to-have`. Tag goes next to confidence."

Orchestrator sorts by tag at re-scope gate. Tags are orchestrator-only — downstream agents never interpret them.

---

## 8. Sentinel Gate

Three checks before Step 2a, every time (including resume):

> "Manifest exists? Lock file exists? Test framework installed? Any fail (non-greenfield): stop. Greenfield: Task 0 must have run."

---

## 9. Condense Devloop SKILL.md

Rewrite the 682-line devloop SKILL.md to ~160 lines using symbolic notation. No file split needed.

**What stays as prose:** Crew table, Step 0 (values), prerequisites, definitions, model assignment, Monkey scope rules (what IS/ISN'T a Frame finding).

**What becomes symbols:**

Step 1:
```
1a: Quartermaster(template) → frame.md
1b: Monkey(template, scope:plan-level) → monkey-frame.md
1c: Gate — Approve / Adjust / Abort
    Survived:no → highlight, re-scope
    Adjust → re-invoke Quartermaster
```

Step 2:
```
2a: Sentinel(template) → test files
    Storm TDD(template) → storm-tdd.md
    critical/high → Gate → re-invoke Sentinel
2b: Shipwright(template, worktree) × N
    independent ∥, dependent →
```

Step 3:
```
3a: Merge worktrees → main (never auto-resolve)
3b: Storm(template) ∥ Cartographer(template)
    → Build Monkey(template)
    Gate: "Storm:[N] Cart:[N] Monkey:[N]. Fix / Discuss / Stop"
    Lean gate: "Storm:[N]. Fix / Discuss / Stop" (Cart + Monkey skipped)
    Normalize at consolidation: Monkey impact tags → severity (breaks-build→critical/high, values-gap→medium, nice-to-have→low)
3c: Consolidate → sort(severity) → triage(matrix) → Gate
    full:   Storm(spec, inline brief) → Sentinel(test, inline brief) → Shipwright(patch, inline brief)
    direct: Shipwright(rename)
    backlog: log, skip
    max 2/finding → backlog
    Note: fix pipeline briefs are inline — short, context-specific, no template needed
3d: tests + typecheck → all pass → shippable
```

Step 4:
```
summary.md → archive(keep artifacts, discard briefs+frame+edge-cases)
→ run-NNNN-name/ → suggest /retro
```

Errors:
```
Sentinel won't compile  → stop, loop to plan
Shipwright fails ×3     → stop worktree, show user
Merge conflict          → never auto-resolve, user picks
Pass in wt, fail merged → integration bug, check Monkey Frame
Typecheck fails         → check Storm Consistency
Fix causes regression   → show both, user decides
```

**What gets deleted entirely:**
- Theme system deleted entirely. Theming is done via CLAUDE.md persona instructions, not engine machinery. Remove theme loading, theme config, theme files, themed voice tables from devloop SKILL.md.
- Brief construction rules (~15 lines) → one line: "Fill template. Write brief. Pass to agent."
- All inline brief examples (the ```markdown blocks) → templates replace them
- Verbose convergence gate prose → symbolic notation above
- Fix pipeline ceremony (~65 lines) → 6-line symbolic notation above

**What moves to brief templates:** All per-agent brief content blocks (the ```markdown sections with slot content).

---

## Implementation

**Create:** 10 brief template files (~10-15 lines each)

**Edit:**

| File | Change |
|------|--------|
| `devloop SKILL.md` | Full rewrite: 682 → ~160 lines. Symbolic notation, template refs, resume check, Lean crew, Sentinel gate, Task 0 note, QM correction, condensed fix pipeline |
| `devloopfast SKILL.md` | Resume check, Sentinel gate, template refs |
| `shipwright SKILL.md` | CLI dep rule, Task 0 contract note |
| `quartermaster SKILL.md` | Plan correction mode, heading preservation |
| `monkey SKILL.md` | Impact tags, summary return |
| `storm SKILL.md` | Summary return |
| `edge-case-hunter SKILL.md` | Summary return |

**Order:** Impact tags (§7) before summary returns (§2). Rest independent.

**Validation — one Small feature:**
1. Briefs from templates
2. Summaries ≤30 lines each
3. Resume detects artifacts
4. Lean crew skips Cart + Build Monkey
5. No hand-written versions
6. QM corrects plan, not orchestrator
7. Impact tags sorted at gate
8. Sentinel gate passes
9. Run completes without context death
