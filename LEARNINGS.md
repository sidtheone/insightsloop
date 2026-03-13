# Learnings

Hard-won lessons from building and running InsightsLoop. Updated when we discover something that changes how the engine should work.

Unlike PATTERNS.md (per-run tactical patterns), these are structural insights about the engine itself — why something drifts, why a role exists, why a boundary matters.

---

## L-001: Orchestrator Drift — The Frame Problem

**Discovered:** 2026-03-13, after observing inconsistent devloop behavior across runs.

**Symptom:** The devloop orchestrator produces different frame.md decompositions for the same plan.md input across runs. Stories get split differently, worktree assignments change, test file mapping varies. Downstream crew (Sentinel, Shipwright) receives different instructions each time — even though the plan didn't change.

**Root cause:** The orchestrator at Step 1 (Frame) was doing decomposition work — deciding how to split tasks into worktrees, which tests belong to which Shipwright, how to parallelize. This is *planning* work, not *orchestration* work. The orchestrator has no codebase exploration context, no user Q&A history, no architecture rationale. It reverse-engineers intent from a compressed plan.md checklist. Different runs, different interpretations, different decompositions.

**Why it happened:** The devloop SKILL.md told the orchestrator to "read the plan, triage, and prepare for build." The word "prepare" quietly expanded into "decompose, parallelize, and assign" — which is Navigator-class work wearing an orchestrator hat. Nobody noticed because the orchestrator is competent enough to *do* the work — it just does it *differently each time*.

**The principle:** Orchestrators route. They don't interpret. If an orchestrator has to make a judgment call about what the plan means, the plan isn't detailed enough — or the wrong agent is reading it.

**Fix:** Introduce The Quartermaster — a dedicated agent that takes any plan.md and produces a deterministic frame.md (atomic tasks, worktree assignments, parallelization plan, test file mapping). The orchestrator calls the Quartermaster, then calls Monkey, then gates. No interpretation. No decomposition. Just routing.

**Why not put this in Navigator?** The devloop should accept plans from any source — Navigator, hand-written, other engines. If frame decomposition lives in Navigator, devloop is coupled to our planner. The Quartermaster keeps devloop engine-agnostic.

---

## L-002: Stories Too Big → Orchestrator Fills Gaps

**Discovered:** 2026-03-13, same investigation as L-001.

**Symptom:** When plan.md tasks are coarse ("Build the API route", "Create the component"), the orchestrator invents sub-tasks at frame time. These invented sub-tasks vary run-to-run.

**Root cause:** The Navigator's task granularity is "what to build" not "how to build it in parallel isolated worktrees." The gap between plan-level tasks and worktree-level assignments is where orchestrator interpretation lives.

**The principle:** The plan should be detailed enough that no agent downstream needs to invent work. If a task is too big for one worktree, the Quartermaster splits it — not the orchestrator.

---

## L-003: Ambiguous Acceptance Criteria → Sentinel Variance

**Discovered:** 2026-03-13, same investigation.

**Symptom:** The Sentinel writes different test contracts for the same plan across runs. The acceptance criteria say "User sees recipe cards sorted by match count" — but sorted ascending or descending? How many cards? What if zero matches?

**Root cause:** Acceptance criteria written from the user's perspective ("User sees X") are good for validation but insufficient for test derivation. The Sentinel has to interpret ambiguous criteria, and interpretation varies.

**The principle:** Acceptance criteria should be verifiable statements, not aspirational descriptions. "User sees recipe cards sorted by match count, highest first, max 20, with an empty state when zero match" leaves no room for interpretation. The Navigator (or Quartermaster) should sharpen criteria before Sentinel receives them.

---

## L-004: Frame Monkey Scope Creep

**Discovered:** 2026-03-12 (s10), observed during real run.

**Symptom:** Frame Monkey produced implementation-level findings (naming conventions, input validation, security hygiene) instead of plan-level architectural challenges. These are findings about imagined code, not about the design.

**Root cause:** The Monkey brief said "challenge the plan" but didn't define what plan-level means vs. implementation-level. The Monkey is good at finding things — it just found things in the wrong layer.

**Fix (applied in v0.10):** Explicit scope rules — "What IS a Frame finding" vs "What is NOT a Frame finding" with examples. Plan-level = impossible requirements, hard dependencies, missing contracts, silent assumptions, design lock-in. Not: naming, validation, security hygiene.

**Status:** Rules written but not yet validated on a real run. See L-005.

---

## L-005: Iterating Without Testing

**Discovered:** 2026-03-13, flagged by user.

**Symptom:** Multiple sessions spent editing SKILL.md files to fix behavioral issues — but no real runs to verify the edits actually changed behavior. We'd observe a problem, write a rule, then immediately move to the next problem without testing the rule.

**Root cause:** SKILL.md editing is fast and satisfying. Running the engine is slow and reveals new problems. The feedback loop was broken — we optimized for writing rules instead of testing them.

**The principle:** One real run is worth ten SKILL.md edits. After making a behavioral change to any crew SKILL.md, the next action must be a test run — not another edit. If the run reveals a new problem, log it, but don't fix it in the same session unless it blocks the test.

---

## L-006: Finder Never Fixes — The 3-Agent Fix Pipeline

**Discovered:** v0.5→v0.8 evolution, formalized in engine-fixes Change F.

**Symptom (v0.5):** The orchestrator would run Storm, read findings, then write code fixes itself. If the orchestrator misunderstood the finding, every downstream change inherited the misunderstanding. Correlated failure — one bad interpretation, compounding damage.

**Root cause:** Combining analysis and implementation in a single agent creates a dependency chain where misunderstanding propagates without a check. The agent that finds a problem is incentivized to simplify it for the fix, losing nuance.

**Fix (v0.8):** 3-agent fix pipeline — Storm writes fix specifications, Sentinel writes test contracts for the fix, Shipwright implements. Each handoff is a checkpoint. If Sentinel can't write a test for Storm's spec, the spec is wrong. If Shipwright can't pass Sentinel's test, the implementation is wrong.

**The principle:** The agent that finds a problem should never be the agent that fixes it. Finding and fixing require different cognitive modes — combining them in one agent creates correlated failure. Separation creates checkpoints.

**Why it survived:** This pattern has been stable from v0.8 through v0.10 with zero reversals. Every run since has used it.

---

## L-007: Parallelization Is Seductive but Costly

**Discovered:** v0.9→v0.10, when 5 parallel vertical Monkeys were collapsed to 1.

**Symptom (v0.9):** 5 separate Monkey agents, one per vertical (Architecture, Data, Security, Integration, Operational). Each ran in its own context window, produced its own findings file, required its own brief construction and dedup pass.

**What went wrong:** 5x context window overhead. 5x brief construction. 5x finding deduplication. The orchestrator spent more time managing Monkey agents than the Monkey spent finding things. Cross-vertical findings (Architecture + Integration overlap) appeared in both outputs, requiring manual dedup.

**Fix (v0.10):** Single Monkey, all verticals in one pass. 3 findings per vertical = 15 findings total. Same coverage, one context window, one brief, one output file.

**The principle:** Parallelize *agents* (Storm + Cartographer in parallel), not *verticals within an agent*. The Monkey already thinks across boundaries — splitting it by vertical is artificial. Parallelization is worth it when agents have genuinely independent workloads (Storm verifying code while Cartographer enumerates paths). It's not worth it when you're splitting one agent's natural thinking into artificial lanes.

**Corollary:** Before parallelizing, ask: "Is the orchestration cost less than the wall-clock savings?" If the answer requires thinking, it's probably not worth it.

---

## L-008: Paste Verbatim — Summarization Is Interpretation

**Discovered:** v0.8, formalized in engine-fixes Change A.

**Symptom:** The orchestrator would read a crew member's SKILL.md, select "relevant" sections, summarize them into the agent brief. Different runs, different sections selected, different summaries produced. The Sentinel in run N got a different understanding of her job than the Sentinel in run N+1.

**Root cause:** The orchestrator was acting as an editor — deciding which parts of the SKILL.md mattered for this particular run. But the SKILL.md is a behavioral contract, not a reference document. Skipping a section means skipping a constraint.

**Fix:** Hard rule — paste the entire SKILL.md verbatim into the agent prompt. No selecting, no summarizing, no paraphrasing. Write run-specific context to a separate brief file. Agent receives: full SKILL.md + brief file path.

**The principle:** When invoking agents, never summarize their instructions. Summarization is interpretation, and interpretation varies. The SKILL.md is law — every clause matters, even the ones that seem irrelevant to this particular run.

---

## L-009: Convergence Gate — Present Before Fixing

**Discovered:** v0.8, formalized in engine-fixes Change E.

**Symptom:** The orchestrator ran Storm + Cartographer + Monkey at Ship, then silently entered the fix pipeline without showing findings to the user. The user had no visibility into what was found, no ability to prioritize, no chance to say "that's not worth fixing."

**Root cause:** The engine treated analysis → fix as a continuous pipeline. But analysis agents produce findings with different severities and confidence levels. Treating all findings equally (fix everything) wastes time on low-value fixes and hides the interesting discoveries.

**Fix:** Explicit convergence gate after all analysis agents return. All findings consolidated into `findings-consolidated.md`, presented to user, user decides which to fix. High-confidence critical findings get fixed; low-confidence medium findings get logged to backlog.

**The principle:** Never auto-fix without showing the user what you found. The convergence gate is where human judgment adds the most value — prioritizing findings is a judgment call, not an automation task.

---

## L-010: Ship Monkey Gets Skipped — Conflated Steps

**Discovered:** Run-0003 (same-day-batch-dedup), 2026-03-12.

**Symptom:** The archive for run-0003 has `monkey-frame.md`, `monkey-tdd.md`, `monkey-build.md` — but no `monkey-ship.md`. The Ship Monkey was never invoked. The final merged diff was never reviewed by chaos.

**Root cause:** The orchestrator conflated the Build and Ship steps. After Shipwright merged worktrees, the orchestrator moved directly to Storm verify without launching the Ship Monkey. The SKILL.md described Ship Monkey as part of Step 3, but didn't enforce it as a hard checkpoint.

**Fix proposed:** Add explicit "Do not skip Ship Monkey" checkpoint in devloop SKILL.md. Ship Monkey reviews the *merged diff* — this is different from Build Monkey (which reviews individual worktree diffs). The merged diff can have emergent issues from combining worktrees that neither Build Monkey nor Storm would catch individually.

**The principle:** If a step is optional, it will be skipped under time pressure. If a step matters, make it a hard gate with a named artifact. No artifact = step didn't run = gate fails.

**Status:** Fix proposed in `engine-fixes-proposed.md` item #2, not yet applied.

---

## L-011: Monkey Findings Chain Across Runs

**Discovered:** Run-0002 → Run-0003 chain, 2026-03-11→12.

**Symptom:** Run-0002's Monkey at Ship used the Time Travel technique and found that same-day batch re-runs create duplicate `score_history` rows with `recorded_at` as date (not timestamp), no uniqueness constraint. Non-deterministic sort order means 50/50 chance of showing stale dimension scores. This finding became the *entire scope* of run-0003.

**Why it matters:** The Monkey at Ship found a real data integrity bug that no other crew member caught. This finding was valuable enough to spawn a new run. The Monkey isn't just a chaos agent — she's a discovery engine. Her findings at Ship are the highest-value findings because they operate on the final merged code, not partial worktrees.

**The principle:** Monkey findings should be treated as potential future run inputs, not just current-run fixes. When a Monkey finding is too large to fix in the current run, it should be logged to the backlog with full context — not just a one-liner, but the technique, the evidence, and the consequence.

**Reinforces L-010:** This is exactly why Ship Monkey must never be skipped. Run-0003's entire scope came from a Ship Monkey finding in run-0002.

---

## L-012: Crew Identity Is a Behavioral Contract, Not Flavor Text

**Discovered:** v0.3 (persona seasoning), validated across runs 0001-0003.

**Symptom (pre-v0.3):** Crew members were described generically ("a code reviewer", "a test writer"). They produced generic output — safe, thorough, but without conviction. The Storm would find issues but hedge them. The Monkey would challenge but pull punches.

**Fix (v0.3):** Personas became behavioral contracts:
- **Sentinel:** "You write law" → one clause, one assertion, unambiguous verdict. Refuses to write implementation.
- **Shipwright:** "Stonemason" → won't touch what isn't his task. Refuses to gold-plate.
- **Storm:** "Hull inspector" → walks state deeper than anyone else. Refuses to skip pre-existing issues.
- **Monkey:** "Enthusiastic chaos" → higher finding count, no pulled punches. Refuses to say "this is probably fine."

**Why it matters:** The persona isn't decoration — it's the *specification* of what the agent refuses to compromise on. When the Shipwright says "I won't touch what isn't my task," that's not flavor text. It's the constraint that prevents scope creep during implementation.

**Evidence:** Run-0001: Monkey hit hard (4/5 findings fixed). Run-0002: Storm found 3 real introduced issues. Run-0003: Monkey at Frame caught seed path crash that expanded scope. Personas with conviction produce more valuable output.

**The principle:** Write personas as behavioral contracts, not job descriptions. Define what the agent *refuses* to do, not just what it does. The refusal is the constraint that keeps the agent in its lane.

---

## L-013: Greenfield Detection Is a Triage Amplifier

**Discovered:** v0.8, formalized in engine-fixes Change B.

**Symptom:** A "small" feature planned for a greenfield project was triaged as small — but actually required scaffolding (framework wiring, config files, CSS setup, test infrastructure) before the feature could be built. The triage was technically correct for the feature but wrong for the total work.

**Fix:** Two-pass greenfield detection (file existence + wiring verification). If greenfield, automatic triage bump: small → medium, medium → architectural. Scaffolding becomes Task 0 — a dependency for everything else.

**The principle:** Triage should consider project state, not just task scope. A small task on a scaffolded project is genuinely small. The same task on a greenfield project includes the invisible work of creating the foundation.

---

## L-014: Constraint Changes Require Insert-Site Audit

**Discovered:** Run-0003 (same-day-batch-dedup), 2026-03-12. Monkey at Frame.

**Symptom:** Plan scoped the uniqueIndex addition to `batch-pipeline.ts` only. Monkey's Existence Question found two seed paths (`src/app/api/seed/route.ts`, `scripts/seed.ts`) with naked INSERTs that would crash after the uniqueIndex shipped. Scope expanded at Frame to fix both.

**Root cause:** The plan considered the feature path (batch pipeline) but not all callers of the affected table. Adding a constraint (uniqueIndex, FK, CHECK) changes the contract for *every* INSERT into that table, not just the one you're fixing.

**The principle:** When adding a schema constraint to table T, grep all `db.insert(T)` calls before writing the plan. This should be a checklist item at plan phase, not a Frame discovery. The earlier you find all affected sites, the cheaper the fix.

**Status:** Documented in PATTERNS.md. Should be formalized as a Navigator checklist item.

---

## L-015: Lower Monkey Confidence = Higher Accuracy

**Discovered:** v0.4 (beta), validated on EcoTicker full-codebase audit.

**Symptom:** Monkey v1 averaged 82 confidence with 48% accuracy. After calibration, Monkey v2 averaged 69 confidence with ~80% accuracy.

**Root cause:** High confidence in v1 meant the Monkey was over-claiming verification depth. It said "full path traced" when it had only checked immediate code. Lower confidence in v2 meant honest self-assessment — "I checked the immediate code, not the full path."

**The principle:** The Monkey knows what it doesn't know. Findings below 80 confidence are valuable as edge cases and architectural questions, not as confirmed bugs. The confidence threshold (default: 80 for devloopfast auto-dispatch) exists because sub-80 findings need human judgment, not because they're wrong.

**Why it matters for engine design:** Don't raise the confidence threshold to "improve quality." You'll just get fewer honest findings. The threshold filters dispatch urgency, not finding value.

---

## L-016: Agent Output Is Ephemeral — Write Files Immediately

**Discovered:** Run-0003, when monkey-ship.md was never written because Ship Monkey was skipped (L-010), and earlier runs where agent output existed in context but wasn't persisted.

**Symptom:** Agent returns findings to orchestrator. Orchestrator processes them, moves to next step. Context window compresses or resets. Findings are lost because they were never written to a file.

**Root cause:** The orchestrator treated agent output as "in memory" and deferred file writing. But agent output in the context window is volatile — it can be compressed, truncated, or lost on context reset.

**Fix:** Hard rule in devloop SKILL.md: "Write `monkey-*.md` / `storm-*.md` / `edge-cases.md` **immediately** after the agent returns." Agent output alone is not persistent.

**The principle:** If an artifact matters for the archive, write it to disk the moment it exists. Don't trust context memory. Context is working memory; files are long-term memory.

**Status:** Rule added for monkey files in v0.10. Should be generalized to all crew output.

---

## Index

| ID | Title | Status |
|:---|:---|:---|
| L-001 | Orchestrator Drift — The Frame Problem | Fix designed (Quartermaster), not yet built |
| L-002 | Stories Too Big → Orchestrator Fills Gaps | Addressed by Quartermaster design |
| L-003 | Ambiguous Acceptance Criteria → Sentinel Variance | Addressed by Quartermaster sharpening criteria |
| L-004 | Frame Monkey Scope Creep | Rules written (v0.10), not yet validated |
| L-005 | Iterating Without Testing | Process discipline — no tooling fix |
| L-006 | Finder Never Fixes — 3-Agent Fix Pipeline | Stable since v0.8, no reversals |
| L-007 | Parallelization Is Seductive but Costly | Fixed in v0.10 (5 Monkeys → 1) |
| L-008 | Paste Verbatim — Summarization Is Interpretation | Fixed in v0.8, stable |
| L-009 | Convergence Gate — Present Before Fixing | Fixed in v0.8, stable |
| L-010 | Ship Monkey Gets Skipped — Conflated Steps | Fix proposed, not yet applied |
| L-011 | Monkey Findings Chain Across Runs | Observation — informs backlog workflow |
| L-012 | Crew Identity Is a Behavioral Contract | Applied v0.3, validated across 3 runs |
| L-013 | Greenfield Detection Is a Triage Amplifier | Applied v0.8, stable |
| L-014 | Constraint Changes Require Insert-Site Audit | Documented in PATTERNS.md, needs Navigator checklist |
| L-015 | Lower Monkey Confidence = Higher Accuracy | Validated empirically, informs threshold design |
| L-016 | Agent Output Is Ephemeral — Write Immediately | Partially applied (monkey files), needs generalization |
