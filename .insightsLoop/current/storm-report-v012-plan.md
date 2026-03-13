# Storm Report — v0.12 Plan Review

Target: `FINAL-PLAN-devloop-v0.12.md` (1006 lines, 15 sections)
Reviewer: Storm (adversarial + consistency)
Date: 2026-03-14

---

## Introduced Issues

| # | Location | Issue | Severity | Suggestion |
|---|----------|-------|----------|------------|
| 1 | §1 line 69 — Init Boot step | Init runs `npm run dev` to verify boot — but dev servers are blocking processes. No mechanism to detect "started successfully" then kill. Init hangs or waits forever. Plan says "starts and responds" with no timeout/kill protocol. | **high** | Specify: start, wait for port/stdout signal, kill, report |
| 2 | §2 line 100 — Greenfield detection | `manifest exists? AND src/ exists?` fails for monorepos. `packages/new-feature/` has no manifest — greenfield for that package but non-greenfield at root. Detection granularity is wrong for monorepo structures. | **medium** | Add: "detection runs from working directory, not repo root" |
| 3 | §2 line 118 — Sentinel gate | "Test framework installed (node_modules/.bin/jest **or equivalent**)" is prose, not mechanical. The gate is supposed to be 3 binary checks. "Or equivalent" requires the orchestrator to interpret what counts — vitest? pytest? cargo? Contradicts "mechanical, not prose-based." | **high** | Enumerate: jest, vitest, mocha, pytest, cargo test. Lookup table, not prose. |
| 4 | §3 line 140 — Seam counting | File system I/O is listed as an integration seam. Reading a config file is file system I/O. Most apps do this. This inflates seam count for trivial features, pushing Small → Medium unnecessarily. | **medium** | Qualify: "File system I/O that is a core feature concern (uploads, file processing), not incidental reads" |
| 5 | §3 line 152 — Triage judgment | "New pattern = architectural approach not already established in the codebase." Deciding what's "established" requires codebase judgment — the exact interpretation the orchestrator is supposed to avoid (L-001). Who counts patterns? | **high** | Quartermaster does triage (it explores codebase). Move criteria to Quartermaster, not orchestrator. |
| 6 | §5 line 268 — Re-scope categorization | Orchestrator categorizes Monkey findings into must-fix/should-fix/backlog. Categorizing requires judgment ("will the build fail?"). The orchestrator routes, not interprets. This violates the core architectural rule. | **high** | Quartermaster categorizes (it understands the plan). Or: Monkey self-categorizes in its output. |
| 7 | §8 line 338 — Resume artifact gap | Lookup table has no artifact for "Sentinel done, Storm TDD not started." Jumps from `monkey-frame.md` → Step 2a (Sentinel) to `storm-tdd.md` → Step 2b (Shipwright). If Sentinel wrote test files but died before Storm TDD, resume sends user back to Sentinel — re-running completed work. | **high** | Add sentinel state: "test files in worktrees but no storm-tdd.md" → resume from Storm TDD |
| 8 | §8 line 360 — Resume staleness | Resume "skips already-completed steps entirely." But the codebase may have changed between interrupt and resume. Sentinel tests may reference files that were modified. No staleness check. | **medium** | Add warning: "Codebase modified since last run. Resume may use stale artifacts." |
| 9 | §10 line 507 — Sentinel template section extraction | `{{PLAN_OUT_OF_SCOPE}}` extracts `## Out of Scope` section from plan.md. If that heading doesn't exist (plans don't always have it), the slot resolves to empty. Sentinel sees `Out of Scope: ` (blank) — looks like the plan intentionally left it empty, not that it was missing. Silent failure. | **medium** | Slot resolution: if heading not found, insert "[Section not present in plan]" |
| 10 | §10 line 630 — Missing slot | §13 adds `{{TRIAGE_LEVEL}}` to monkey brief templates. The slot resolution table in §10 (line 624) does not include `{{TRIAGE_LEVEL}}`. Orchestrator has no resolution rule for this slot. | **high** | Add `{{TRIAGE_LEVEL}}` to slot resolution table. Source: frame.md triage field. |
| 11 | §11 line 683 — Dual categorization scheme | Summary return format says "category (must-fix/should-fix/backlog **or** severity)." Monkey uses must-fix/should-fix/backlog. Storm uses critical/high/medium/low. Convergence gate receives mixed schemes from different agents. No normalization step. | **medium** | Pick one scheme. Map at output time, not at consumption time. |
| 12 | §12 line 735 — Plan correction scope | "Do not add scope — only resolve the specific findings." But resolving findings often requires adding scope (e.g., "API doesn't return field X" → add transformation layer). Constraint contradicts the reality of what corrections require. Quartermaster gets stuck. | **high** | Change to: "Do not add scope beyond what the finding requires. If a finding requires new scope, present the options." |
| 13 | §12 line 732 — Re-decomposition overwrites | Quartermaster in correction mode "re-runs decomposition (updated frame.md)." Frame is rebuilt entirely. If the user manually annotated the previous frame, those annotations are lost. No diff — full replacement. | **medium** | Quartermaster diffs against previous frame, preserves user additions |
| 14 | §12 — No re-validation after correction | Quartermaster corrects plan → re-decomposes → updated frame. But the Monkey's findings were against the *original* plan. Corrections may introduce new issues. Nobody re-validates. The Monkey doesn't re-run on the corrected plan. | **high** | Address: does Monkey re-run on corrected plan? If not, state the accepted risk. |
| 15 | §14 line 801 — Forced uncertainty | "If you found nothing, you didn't look hard enough" mandates minimum 1 uncertainty. For Small triage features (0-1 seams, e.g., "change button color"), forcing uncertainty is manufacturing noise. Violates VALUES: "Delete before you add." | **medium** | Tie to triage: Small with 0 seams may have "Uncertainties: None — no external boundaries." Medium+ requires minimum 1. |
| 16 | §1 line 80 — Idempotence claim | "CLI scaffolders handle existing directories." `create-next-app` prompts interactively when dir exists in non-empty dir. In non-interactive shell (agent context), it fails or overwrites. Idempotence is not guaranteed. | **medium** | Add: Init checks if scaffold target is empty. If not, skip scaffold step. |

## Consistency

| # | Location | Inconsistency | Canonical Form | Action |
|---|----------|---------------|----------------|--------|
| C1 | §5 vs §6 (Storm) vs §11 | Three categorization schemes coexist: must-fix/should-fix/backlog (plan-level), critical/high/medium/low (code-level), and "or" in summary returns | Two schemes by context: plan-level = must-fix/should-fix/backlog, code-level = critical/high/medium/low | Make explicit in §11: "Frame Monkey returns must-fix/should-fix/backlog. All other agents return critical/high/medium/low." Remove the "or." |
| C2 | §3 vs devloop SKILL.md | "Triage" used for two things: feature size (Small/Medium/Architectural) and fix dispatch matrix triage | Feature size = **triage**. Fix dispatch = **severity routing** | Rename in §3 or add qualifier: "size triage" vs "fix triage" |
| C3 | §3 line 167 vs §15 flow diagram | §3 Lean crew table shows 5 agents (Monkey, Sentinel, Storm TDD, Shipwright, Storm Verify). Flow diagram §15 shows Step 3b has "Storm Verify" for Lean but frame step has Quartermaster too. Quartermaster is not in the Lean/Full table but is always present. | Quartermaster is always present (not part of Lean/Full selection) | Add footnote to §3 table: "Quartermaster always runs. Table shows variable crew members only." |
| C4 | §10 slot table vs §13 | §13 adds `{{TRIAGE_LEVEL}}` to monkey templates. §10 slot resolution table (the authoritative source) doesn't list it. | Slot resolution table is canonical | Add entry to §10 table |
| C5 | §7 line 309 — "6 steps" vs method list | Plan says "The Quartermaster's 7-step method becomes 6 steps" then lists steps 1-6. Step 5 is "Map test files" and step 6 is "Sharpen acceptance criteria." Current SKILL.md step 6 is "Sharpen acceptance criteria." Matches. | Consistent (no action) | — |

## Pre-existing Issues

| # | Location | Issue | Severity | Suggestion |
|---|----------|-------|----------|------------|
| P1 | devloop SKILL.md — brief construction | Current briefs are prose-constructed (L-008 risk). §10 improves this but doesn't fully eliminate it — the orchestrator is still an LLM doing "mechanical" replacement. Templates reduce surface area but don't make it deterministic. | **medium** | Acknowledged as improvement, not fix. True fix would require non-LLM template engine. |
| P2 | LEARNINGS L-010 | "Ship Monkey Gets Skipped — Fix proposed, not applied." v0.12 adds Build Monkey to Full crew and explicitly states Lean skips it. But L-010 was about the orchestrator skipping it even in Full runs. The plan doesn't address the enforcement mechanism. | **medium** | Add to devloop SKILL.md: "Build Monkey is mandatory for Full crew. Skipping is a rule violation." |
| P3 | Monkey SKILL.md — 4 verticals | Monkey selects techniques by step (Frame, TDD, Build, Ship). §13 says "2/vertical × 4 verticals = 8 max for Small." But the technique selection for Frame lists 3 techniques (Assumption Flip, Scale Shift, Existence Question), not 4 verticals. "Vertical" count isn't defined in the Monkey SKILL.md. | **low** | Clarify what "vertical" means in Monkey context. Is it technique? Target area? |

---

## Summary

**16 introduced issues:** 6 high, 7 medium, 0 critical, 3 low (counted in-table)
**5 consistency findings:** 4 actionable, 1 clean
**3 pre-existing issues**

### Top 5 — Highest Impact

1. **#6 (high)** — Orchestrator categorizes Monkey findings. Violates L-001. The orchestrator is interpreting, not routing.
2. **#14 (high)** — No re-validation after plan correction. Monkey findings are against the original plan. Corrections may introduce new issues uncaught.
3. **#5 (high)** — Triage requires codebase judgment. Orchestrator can't decide what's "established" without interpreting. Should be Quartermaster's job.
4. **#7 (high)** — Resume has a blind spot between Sentinel completion and Storm TDD. Users lose Sentinel work on resume.
5. **#12 (high)** — "Don't add scope" constraint on plan corrections is unrealistic. Will block Quartermaster on findings that inherently require scope changes.

### Values Alignment

The plan mostly aligns. One tension: **§14 (forced uncertainty)** conflicts with "Delete before you add" — mandating uncertainty for zero-seam features is adding noise for completeness. The plan should tie this to triage level, not make it universal.
