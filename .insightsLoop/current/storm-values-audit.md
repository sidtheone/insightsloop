# Storm Values Audit — v0.12 Plan + Storm Report

Reviewing the v0.12 plan AND the Storm report itself against VALUES.md.
Date: 2026-03-14

---

## Part 1: Plan vs Values

### "Three lines beat a clever abstraction."

| Section | Verdict | Issue |
|---------|---------|-------|
| §10 Brief Templates | **Tension** | 8 template files + a 30-row slot resolution table + orchestrator instructions to do mechanical replacement. This is an abstraction layer. The alternative — prose instructions — was 3 lines per agent. Templates are better for correctness (kill L-008), but they ARE a "just in case" layer. The slot resolution table is framework-level machinery for what agents were already doing. **Mitigating factor:** the problem is real (context death killed v0.11). The abstraction earns its place by solving a measured failure, not a theoretical one. |
| §8 Resume | **Tension** | 7-row artifact lookup table, staleness detection, archive logic, inconsistency handling. ~30 lines in SKILL.md for a feature that fires only on interrupted runs. "Delete before you add" — how often do runs actually get interrupted? v0.11 hit context death once. Is a full resume system the right response, or would "start fresh with a note about what completed" be the three-line solution? |
| §1 Init | **Clean** | Init is a new agent, but it replaces scattered scaffolding logic in the Quartermaster. Net complexity goes down — one agent owns scaffolding instead of it being step 7 of another agent's 7-step method. |
| §3 Triage criteria | **Clean** | Mechanical count (seams + patterns) replaces prose-based judgment. Simpler. |
| §12 Plan corrections | **Tension** | Adds a second mode to the Quartermaster (decomposition + correction). Two modes in one agent is a complexity vector. But the alternative — orchestrator edits plan.md — was worse (violated L-001). Acceptable. |

**Verdict:** §8 Resume is the biggest values tension. It's a 30-line abstraction for an edge case. Consider: would a simpler "show what exists, let user decide" (5 lines) serve 90% of cases?

### "Read it top to bottom or rewrite it."

| Section | Verdict | Issue |
|---------|---------|-------|
| §15 Flow diagram | **Clean** | Flow is linear and readable. Good. |
| §10 Slot resolution | **Tension** | Reading the orchestrator's brief construction requires cross-referencing: template file → slot name → resolution table → source file. That's 4 indirections. Not readable top-to-bottom. A reader of devloop SKILL.md can't understand brief construction without flipping between §10's template, the slot table, and the agent's SKILL.md. |
| §3 + §5 + §13 | **Tension** | Triage level (§3) → Monkey findings cap (§13) → re-scope categorization (§5) → plan correction (§12). Understanding how a Small feature flows requires reading 4 non-adjacent sections. The plan is well-organized by topic but not by flow. |

**Verdict:** §10 introduces necessary indirection but it's not easy to follow. The implementation should keep the slot table inline in devloop SKILL.md (not a separate file) to reduce jumps.

### "Delete before you add."

| Section | Verdict | Issue |
|---------|---------|-------|
| §9 Theme gap fill | **Tension** | 14 new themed messages × 3 themes = 42 new lines of voice copy. These are decorative — they don't change behavior. The orchestrator works fine without themed messages for Init, Resume, Triage. It falls back to plain English, which is functional. 42 lines of copy that don't affect correctness. Conflicts with "Nothing decorative." |
| §14 Forced uncertainty | **Violates** | Mandates output ("minimum 1 uncertainty") for all features. For a zero-seam Small feature, this forces the Quartermaster to manufacture a concern. Adding noise to satisfy a rule is the opposite of "delete before you add." Storm report #15 caught this correctly. |
| §7 Quartermaster removal of step 7 | **Aligns** | Removing greenfield from Quartermaster is deletion. Good. |
| §4 Sentinel scope rules | **Aligns** | Adding exclusion rules (don't create infra files) is constraint, not addition. Prevents over-generation. |

**Verdict:** §9 and §14 add without earning it. §9 is low-priority polish. §14 is a rule that generates noise.

### "Untested code doesn't leave the engine."

| Section | Verdict | Issue |
|---------|---------|-------|
| §1 Init | **Gap** | Init creates a scaffold and verifies it boots. But Init itself has no test — there's no validation criteria for "Init worked correctly" beyond "files exist." What if the scaffold is subtly wrong (wrong tsconfig target, missing compiler option)? The boot check catches crashes but not misconfigurations. |
| §8 Resume | **Gap** | Resume logic is untested by design — it's artifact detection in the orchestrator. No Sentinel writes tests for orchestrator behavior. The orchestrator is the one agent that isn't tested. |

**Verdict:** The engine enforces "untested code doesn't ship" for Shipwright output but not for orchestrator logic (Init, Resume, triage criteria). This is a pre-existing gap that v0.12 widens by adding more orchestrator logic.

### "Content over chrome." / "Nothing decorative."

| Section | Verdict | Issue |
|---------|---------|-------|
| §9 Theme gap fill | **Violates** | 42 lines of themed voice copy. "The keel cracked. Can't sail what won't float." is atmospheric but doesn't inform. The user needs to know "Init step 2 failed: npm ERR! ENETWORK" — not a pirate metaphor. Theme is chrome. The Init step report (line 74-78) already has the functional output. The themed wrapper adds no information. |

**Verdict:** §9 conflicts with two values. It's polish, not priority.

### "Subtract until it breaks, then add one back."

| Section | Verdict | Issue |
|---------|---------|-------|
| Whole plan | **Question** | v0.12 adds: 1 new agent (Init), 1 new capability (Resume), 8 new files (brief templates), 42 new theme lines, 2 new Quartermaster modes, triage criteria, re-scope categorization, summary returns, forced uncertainty. That's a lot of addition. What's the minimum v0.12 that fixes context death (the actual failure)? Answer: §10 + §11 (brief templates + summary returns). Everything else is improvement, not fix. |

**Verdict:** The plan is comprehensive but not minimal. A values-aligned v0.12 would ship §10 + §11 first, validate, then layer on the rest.

---

## Part 2: Storm Report vs Values — Auditing My Own Findings

| Finding | Values-aligned? | Issue |
|---------|-----------------|-------|
| #1 (Init boot hangs) | **Yes** — real failure mode, specific scenario | — |
| #2 (Monorepo detection) | **Questionable** — neither EcoTicker nor InsightsLoop is a monorepo. This is a theoretical concern for a project that doesn't have this structure. "Don't design for hypothetical future requirements." | Downgrade to low or cut |
| #3 (Sentinel gate "or equivalent") | **Yes** — mechanical vs prose is a real distinction | — |
| #4 (File I/O seam inflation) | **Yes** — prevents over-triaging | — |
| #5 (Triage judgment) | **Yes** — L-001 violation is architectural | — |
| #6 (Orchestrator categorizes) | **Yes** — L-001 violation is architectural | — |
| #7 (Resume artifact gap) | **Conditional** — valid IF resume ships. If resume is cut (per "subtract until it breaks"), this finding is moot. | Depends on §8 decision |
| #8 (Resume staleness) | **Same** — conditional on §8 | Depends on §8 decision |
| #9 (Silent empty slot) | **Yes** — silent failure is a real bug | — |
| #10 (Missing TRIAGE_LEVEL) | **Yes** — missing entry in authoritative table | — |
| #11 (Dual categorization) | **Yes** — consistency is mechanical, not stylistic | — |
| #12 (Don't add scope) | **Yes** — constraint that blocks work | — |
| #13 (Re-decomposition overwrites) | **Questionable** — "Quartermaster diffs against previous frame, preserves user additions" adds complexity to solve a rare case. How often does the user annotate frame.md? If never, this finding manufactures work. | Downgrade to low unless user confirms they annotate frames |
| #14 (No re-validation) | **Resolved** — accepted risk folded into plan | — |
| #15 (Forced uncertainty) | **Yes** — values violation caught correctly | — |
| #16 (Idempotence) | **Yes** — specific scenario (create-next-app in non-empty dir) | — |

### Self-corrections

**Cut #2** — monorepo concern is theoretical. Neither project is a monorepo. If it becomes one, the detection can be updated then. "Don't design for hypothetical future requirements."

**Downgrade #13 to low** — preserving user annotations on frame.md is a feature for a workflow that hasn't been observed. If users annotate frames, this matters. If they don't, it's premature.

**#7 and #8 are conditional** on whether §8 (Resume) ships in v0.12 at all. Per values analysis, Resume is a 30-line abstraction for an edge case. It could be deferred.

---

## Part 3: Recommendations — Values-Prioritized Implementation Order

**Must ship (fixes the failure that killed v0.11):**
- §10 Brief templates
- §11 Summary returns

**Should ship (architectural hygiene, prevents known issues):**
- §4 Sentinel scope fixes (already applied)
- §6 Shipwright dependency rules
- §7 Quartermaster: remove greenfield, add correction mode
- §1 Init (only if next test run is greenfield)
- §12 Quartermaster owns plan corrections
- §13 Monkey 2/vertical for Small

**Defer (improvement, not fix):**
- §8 Resume — 30-line abstraction for rare edge case. Simpler alternative: "show what exists, let user decide" (5 lines)
- §9 Theme gap fill — 42 lines of chrome. Functional without it.
- §14 Forced uncertainty — violates "delete before you add" as written. Revisit tied to triage.

**Resolve before implementation (high-severity Storm findings):**
- #5 + #6: Who does triage and categorization? Move to Quartermaster.
- #3: Enumerate test frameworks in Sentinel gate.
- #10: Add TRIAGE_LEVEL to slot table.
- #12: Relax "don't add scope" to "don't add scope beyond what the finding requires."
