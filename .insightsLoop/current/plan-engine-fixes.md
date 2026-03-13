# Plan: InsightsLoop Engine Fixes (v0.5)

## Intent

Fix 8 categories of handover and invocation issues discovered during the foodsaverapp run. The engine built components and tests that all passed, but the app couldn't run — missing scaffolding, missing CSS, no acceptance tests, analysis findings not auto-fixed, orchestrator paraphrasing personas, and weak persona delivery.

## Out of Scope

- New personas or skills
- ~~Devloopfast changes (will mirror devloop changes in a separate pass)~~ **Done** — mirrored in this pass
- Theme files (bunny references cleaned as part of H)
- Config.md changes
- Retro skill changes
- `context: fork` or Skill-based invocation (too costly — staying with Agent)

## Acceptance Criteria

1. A greenfield project run through devloop produces a bootable app (scaffolding files exist, entry page renders, CSS loads)
2. Fix pipeline auto-fixes critical/high findings: Storm specs → Sentinel tests → Shipwright patches — user approves the bundle, not individual triggers
3. All findings (Monkey across all phases + Storm + Cartographer) appear in one consolidated report at ship time
4. Orchestrator pastes crew SKILL.md verbatim and presents crew output as-is — no paraphrasing, no narration
5. The Monkey is never called "bunny" in any skill file or orchestrator output

## Changes

### A. Fix orchestrator brief construction (devloop SKILL.md)

**Current:** Orchestrator reads each crew SKILL.md, selects sections (Identity, Method, Rules), and pastes them into an Agent prompt with context. This allows the orchestrator to summarize, skip sections, inject its own voice ("The bunny found..."), and miss instructions.

**Change:** Three rules for the orchestrator:

1. **Paste SKILL.md verbatim.** Not "paste Identity + Method + Rules sections." The entire SKILL.md file content. No summarizing, no selecting, no paraphrasing.

2. **Write context to a brief file.** Instead of 10+ lines of inline brief construction per crew member, write context to `.insightsLoop/current/brief-<crew>.md` and add one line to the Agent prompt: "Read `.insightsLoop/current/brief-<crew>.md` for your mission context." This keeps the Agent prompt short (SKILL.md + one read instruction) and the context complete + inspectable.

3. **Present crew output as-is.** When an Agent returns, show its output directly. Do not rewrite, narrate, or summarize in the orchestrator's own voice. The crew speaks for themselves.

**Brief file format per crew member:**

```markdown
# Sentinel Brief
## Plan
[full plan sections: Intent, Out of Scope, Architecture, Tasks, Key Files — NOT Challenge]
## TDD Matrix
[TDD-MATRIX.md content if exists, else "None"]
## Test Framework
[framework, test directory, existing patterns]
## Values
[VALUES.md content if exists, else "None"]
## Scaffolding Checklist
[read from .insightsLoop/current/scaffolding-checklist.md if greenfield, else "Not greenfield — skip"]
## Acceptance Criteria
[from plan, if exists]
```

```markdown
# Shipwright Brief
## Plan
[full plan.md including Challenge]
## Test Files
[list of test file paths assigned to this Shipwright]
## Task Scope
[which tasks from the plan are theirs]
## Values
[VALUES.md content if exists]
## Visual Spec
[from plan, verbatim, if exists]
## Mockup Path
[path to mockup.html if exists, else "None"]
```

```markdown
# Storm Brief (Verify Mode)
## Diff
[full merged diff]
## Values
[VALUES.md content]
## Intent
[1-2 sentences from plan Intent]
```

```markdown
# Storm Brief (Plan Review Mode)
## Plan
[full plan.md content — Intent through Challenge]
## Acceptance Criteria
[from plan, verbatim]
## Values
[VALUES.md content if exists, else "None"]
```

```markdown
# Storm Brief (Fix Spec Mode)
## Triaged Findings
[critical/high findings from findings-consolidated.md that have file:line locations]
[each finding includes: #, Source, Location (file:line), Issue (full sentence), Severity]
[conceptual findings without file:line are excluded — they go to Backlog in the consolidated report]
## Values
[VALUES.md content]
```

```markdown
# Monkey Brief
[follows existing monkey-brief-template.md — no change to template format]
[context written to brief file instead of inlined]
```

**Brief file naming and lifecycle:**
- **Naming:** `brief-<crew>.md` for single-invocation crew (sentinel, shipwright, cartographer). `brief-<crew>-<mode>.md` when a crew has multiple modes (e.g., `brief-storm-verify.md`, `brief-storm-fixspec.md`, `brief-storm-planreview.md`). Monkey uses `brief-monkey.md` — overwritten each step (the monkey-brief-template already structures per-step context; the brief file is just the delivery mechanism).
- **Cleanup:** All `brief-*.md` files are added to the archive **discard list** in devloop Step 4. They are ephemeral context, not artifacts.
- **Plan SKILL.md briefs:** Change E uses the same naming convention (`brief-monkey.md`, `brief-storm-planreview.md`) and the same discard rule. The plan SKILL.md must define its own brief construction inline — it does NOT reference Change A's devloop instructions. Both orchestrators follow the same format contracts (defined above), but each owns its own brief construction code.

**Files to change:** devloop SKILL.md (Steps 2a, 2b, 3b, 3c — all crew invocation blocks)

### B. Greenfield gate (devloop SKILL.md Step 1)

**Current:** No detection. Shipwright gets plan tasks and starts building components regardless of whether the project can boot.

**Change:** Frame step detects greenfield, confirms with user, and generates scaffolding checklist.

**Detection logic (two-pass: existence then wiring):**

*Pass 1 — File existence:*
1. Check if `package.json` (or equivalent: `requirements.txt`, `go.mod`, `Cargo.toml`) exists in project root
2. Check if framework entry file exists (e.g., `app/layout.tsx` for Next.js, `src/main.tsx` for Vite)
3. Check if framework config exists (e.g., `next.config.*`, `vite.config.*`, `tailwind.config.*`)
4. If any core file is missing → greenfield

*Pass 2 — Wiring verification (runs even if Pass 1 finds all files):*
5. Check that entry file has non-empty content (not just a bare `export default` or empty component)
6. Check that layout file imports and wraps children (for Next.js: `{children}` in JSX)
7. Check that CSS entry file contains framework directives (e.g., `@tailwind base` or `@import "tailwindcss"`)
8. Check that `package.json` has framework as a dependency (e.g., `next`, `react`, `vite`)
9. If any wiring check fails → partially-scaffolded (treat as greenfield with pre-existing files noted)

**Why two passes:** The foodsaverapp had `package.json` and `next.config.ts` from `create-next-app` but couldn't boot — the files existed but didn't wire together. Checking existence alone gives false negatives for the most common greenfield case: scaffolding tool output with nothing custom.

**User gate:** "Detected [greenfield / partially-scaffolded] project. Scaffolding checklist: [list]. Files already present: [list]. Correct, or is this an existing project with non-standard structure? [Approve / Skip / Edit]"

**Checklist generation (after user approves):**
- Read plan's Architecture section for stack choice
- Generate list of files required to boot that stack, including their **minimum viable content** (not just filenames):
  - **Next.js + Tailwind:** app/layout.tsx (must wrap `{children}`, import globals.css), app/page.tsx (must export default component), app/globals.css (must contain Tailwind directives), tailwind.config.ts, postcss.config.js, next.config.ts, .gitignore, .env.example
  - **Vite + React + Tailwind:** index.html (must reference src/main.tsx), src/main.tsx (must render App into root), src/App.tsx (must export default component), src/index.css (must contain Tailwind directives), vite.config.ts, tailwind.config.ts, postcss.config.js, .gitignore, .env.example
  - **Other stacks:** Derive from architecture section. Present checklist to user for confirmation before proceeding.
- Include design tokens from Visual Spec if present (CSS custom properties, font imports, color palette)
- For partially-scaffolded projects: checklist marks existing files as "exists — verify wiring" vs missing files as "create"

**Output:** Scaffolding checklist written to `.insightsLoop/current/scaffolding-checklist.md` (standalone file, not appended to frame.md). Added to archive keep-list so the scaffolding contract is traceable in retros. Passed to Sentinel in brief file via the checklist file path.

**Files to change:** devloop SKILL.md (Step 1 — Frame)

### C. ATDD in Sentinel (sentinel SKILL.md)

**Current:** Sentinel writes per-task contracts (component-level). No user-flow tests. No scaffolding verification.

**Change:** Add acceptance test step as the first thing Sentinel does, before per-task contracts.

**New Method step (inserted before "Identify contracts"):**

> **1.5. Write acceptance contracts from story intent.**
> - Read the plan's Acceptance Criteria section (added by Change D)
> - Write 1-3 tests that verify the user flow end-to-end at the page level
> - If a scaffolding checklist is provided (greenfield), also write tests that verify:
>   - Entry page renders without error
>   - Entry page contains the main component specified in the plan
>   - Required scaffolding files exist and wire together (layout wraps page, page imports component)
> - Acceptance tests go in a separate file: `__tests__/acceptance/<story-slug>.test.tsx` (or match project convention)
> - These are the first tests written and the last to pass — they verify integration, not units

**New Inputs addition:** Sentinel's Inputs section adds:
- **Acceptance Criteria** from plan (if exists)
- **Scaffolding checklist** (if greenfield)

**New Rule:** "Acceptance tests verify the user can complete the story. They render the page, simulate the flow, and check the outcome. They are not component tests — they are integration contracts."

**Files to change:** sentinel SKILL.md (Method, Inputs, Rules sections)

### D. Acceptance Criteria in Plan (plan SKILL.md)

**Current:** Plan has Intent, Architecture, Tasks, Challenge. No explicit user-level definition of "done."

**Change:** Add `## Acceptance Criteria` section to plan output. Written during Phase 4 (Architecture), after Tasks, before Challenge.

**Format:** 2-4 statements in plain English describing what the user can do when the story is done:
```
## Acceptance Criteria
1. User lands on `/`, sees ingredient input field ready to type
2. User adds 3 ingredients, clicks "Find Recipes", sees recipe cards sorted by match count
3. Feel-good message shows "Saving 3 ingredients from going to waste!"
4. No results state shows helpful message when no recipes match
```

**These feed into:**
- Sentinel: derives acceptance test file from them
- Monkey: challenges them during plan review (Change E)
- Storm: checks for implicit assumptions during plan review (Change E)

**Files to change:** plan SKILL.md (Phase 4 output format, Phase 6 plan.md template)

### E. Monkey + Storm review the plan (plan SKILL.md Phase 5)

**Current:** Phase 5 (Challenge) runs only the Monkey on the plan. One finding, limited coverage.

**Change:** Phase 5 runs Monkey + Storm in parallel on the complete plan (including the new Acceptance Criteria section).

**Monkey at Plan:** Challenges scope, requirements, acceptance criteria. Uses full technique arsenal. Same as current but now also targets Acceptance Criteria.

**Storm at Plan (new):** Adversarial review for:
- Assumptions: does Architecture assume things Tasks don't create?
- Naming consistency: do section references match? (e.g., Architecture says "RecipeCard" but Tasks say "RecipeItem")
- Implicit contracts: what's assumed between components that isn't stated?
- Missing failure modes: what happens when dependencies fail?
- Acceptance Criteria gaps: do the criteria actually cover the Intent?

**Orchestrator presents both sets of findings. User gate: approve plan or revise.**

**Brief construction (self-contained — plan SKILL.md owns its own brief code):**
1. Paste full SKILL.md verbatim for each crew member (Monkey, Storm)
2. Write plan context to brief files:
   - `brief-monkey.md` — follows monkey-brief-template.md format with plan as target
   - `brief-storm-planreview.md` — uses Storm Brief (Plan Review Mode) format from Change A's contract: `## Plan` (full plan.md), `## Acceptance Criteria` (verbatim), `## Values` (VALUES.md or "None")
3. Present crew output as-is — no paraphrasing, no narration
4. Brief files are ephemeral — discarded after plan is finalized (plan SKILL.md doesn't archive)

**Note:** The brief format contracts are defined in Change A. Both plan and devloop orchestrators follow the same formats, but each owns its own brief construction code. This avoids cross-skill references that drift.

**Files to change:** plan SKILL.md (Phase 5)

### F. Analysis findings → auto-fix pipeline (devloop SKILL.md Step 3c, storm SKILL.md)

**Current:** Storm/Cartographer find issues → presented to user → user says "fix" → orchestrator manually patches each file. No tests written for the fixes. No agent dispatched.

**Change:** Storm finds → Storm writes fix specs → Sentinel writes regression tests → Shipwright patches → user approves. The finder never writes the fix. This preserves the engine's foundational rule: "Never run TDD and build in the same agent."

**Flow:**
1. Storm + Cartographer return findings (Step 3b, unchanged)
2. Consolidate all findings (Change G)
3. Triage: identify critical/high findings that have file:line locations and need code changes. Conceptual findings (no file:line) go straight to Backlog — they can't be auto-fixed.
4. Storm is re-invoked in **Fix Spec Mode** with triaged findings
5. In Fix Spec Mode, Storm writes a fix spec per finding:
   - What the regression test should assert (expected failure behavior)
   - Where the fix should go (file, function, line range)
   - What the minimum patch should do (not the code — the intent)
   - She does NOT write tests or code. She specifies.
6. Sentinel is invoked with fix specs → writes regression tests (one per finding, must fail before fix)
7. Shipwright is invoked with fix specs + failing tests → applies minimum patches, runs full suite
8. User gate: "Fix pipeline patched N findings. Here's the diff and new tests. Approve?"
9. If tests fail after fixes: stop, present failures to user. Max 2 fix attempts per finding.

**Why three agents, not one:** Storm finding and fixing her own bugs is a correlated failure — her test encodes the same mental model as her finding. If she misidentifies the root cause, the test and fix share the same blind spot. By splitting: Storm specifies *what's wrong* (her strength), Sentinel writes *what correct looks like* (independent perspective), Shipwright writes *the minimum fix* (different agent, constrained by an external test). The user gate is the fourth check.

**Storm SKILL.md addition — Fix Spec Mode:**

> ## Fix Spec Mode
>
> When invoked with fix context (findings + values), you write specifications for fixes — not the fixes themselves.
>
> **Method:**
> 1. Read each triaged finding: location, issue, severity
> 2. For each finding, write a fix spec:
>    a. **Regression test contract:** What should the test assert? What input triggers the bug? What's the expected vs actual behavior?
>    b. **Fix location:** File, function, line range
>    c. **Fix intent:** What the patch should do, in one sentence. Not code — intent.
>    d. **Boundary:** What the fix should NOT touch. Adjacent code, other functions, refactoring.
> 3. Output all fix specs in a single `fix-specs.md` file.
>
> **Rules:**
> - Do not write test code. Do not write patch code. You specify, others build.
> - Fix specs in severity order: critical first, then high
> - One spec per finding. Don't combine.
> - If a finding is too vague to spec (no file:line, unclear trigger), mark it "Unresolved — needs manual investigation" and move on.

**Files to change:** devloop SKILL.md (Step 3c), storm SKILL.md (new Fix Spec Mode section)

### G. Consolidated findings report (devloop SKILL.md Step 3c)

**Current:** Monkey findings scattered across monkey-frame.md, monkey-tdd.md, monkey-build.md, monkey-ship.md. Storm findings in storm-report.md. Cartographer in edge-cases.md. No unified view.

**Change:** After Storm + Cartographer return (before Fix), merge all findings into `findings-consolidated.md`.

**Format:**
```markdown
# Consolidated Findings

| # | Source | Phase | Location | Issue | Severity | Status |
|---|--------|-------|----------|-------|----------|--------|
| 1 | Storm | Ship | route.ts:33 | API key not checked | Critical | Fixed |
| 2 | Monkey | Build | route.ts:33 | API key not checked | High | Dup of #1 |
| 3 | Cartographer | Ship | IngredientInput:28 | No concurrent search guard | Medium | Backlog |
```

**No auto-dedup.** Present all findings grouped by file + line range. If findings look like duplicates, note "Possible dup of #N" but don't auto-collapse. User confirms.

**Sub-sort:** Group by severity (Critical → High → Medium → Low), sub-sort by file + line.

**Location column contract:** The Location column must distinguish between actionable and conceptual findings:
- **Actionable:** `file.ts:33` or `ComponentName:28` — has a file:line reference. Eligible for Fix Spec pipeline.
- **Conceptual:** `[concept] the caching assumption` — prefixed with `[concept]`. No file:line. Goes straight to Backlog. These are typically Monkey findings about scope, requirements, or architecture.

The orchestrator filters the consolidated table for Fix Spec Mode by selecting rows where: `Severity ∈ {Critical, High}` AND `Location` does NOT start with `[concept]` AND `Status` is not `Dup of #N`. This filtered set is written into the Storm Brief (Fix Spec Mode) with the full Issue text (not truncated table cells).

**Status column populated after Fix pipeline:** Fixed, Unresolved, Backlog, Dup of #N.

**Add to archive keep-list:** `findings-consolidated.md` and `fix-specs.md` must be in the devloop archive keep-list so findings and fix contracts are traceable in retros.

**Files to change:** devloop SKILL.md (Step 3c — new consolidation step before Fix, archive keep-list)

### H. Monkey identity (monkey SKILL.md)

**Current:** Monkey persona text contains "bunny" references. Orchestrator narrates Monkey output using "bunny" language.

**Change:**
- **Rewrite** (not grep-replace) Monkey persona section in SKILL.md. Remove all "bunny" references. She's the Monkey — chaotic, curious, relentless. Write a new persona paragraph that matches the energy of the existing one but uses "Monkey" identity.
- **Orchestrator narration fixed by Change A** — orchestrator presents output as-is, doesn't narrate.
- **Check description field** in YAML frontmatter — if it says "Chaos Bunny", change to "Chaos Monkey" or similar.
- **Check monkey-brief-template.md** for any bunny references.

**Files to change:** monkey SKILL.md (persona section, frontmatter), monkey-brief-template.md (if applicable)

## Task Order

1. ~~**H — Monkey identity** (persona rewrite, unblocks clean testing)~~ **DONE** — monkey SKILL.md, README.md, 3 theme files
2. ~~**D — Acceptance Criteria in Plan** (plan SKILL.md, independent)~~ **DONE** — Phase 4b + plan.md template
3. ~~**C — ATDD in Sentinel** (sentinel SKILL.md, depends on D for acceptance criteria format)~~ **DONE** — Step 1.5, inputs, rules
4. ~~**B — Greenfield gate** (devloop Step 1, depends on C so Sentinel knows about scaffolding checklist)~~ **DONE** — 2-pass detection, scaffolding-checklist.md
5. ~~**A — Fix orchestrator brief construction** (devloop SKILL.md, structural change to all crew invocations)~~ **DONE** — 3 rules, brief formats, naming, discard list
6. ~~**E — Monkey + Storm on plan** (plan SKILL.md Phase 5, depends on A for brief construction pattern)~~ **DONE** — parallel review, Plan Review Mode brief
7. ~~**G — Consolidated findings** (devloop Step 3c, independent of F)~~ **DONE** — `[concept]` location contract, filtering
8. ~~**F — Auto-fix pipeline** (devloop Step 3c + storm SKILL.md, depends on A and G)~~ **DONE** — 3-agent split, Fix Spec Mode
9. ~~**Devloopfast mirror**~~ **DONE** — all 8 changes mirrored

## Key Files

- `/Users/sidhartharora/dev/claude/insightsloop/skills/insight-devloop/SKILL.md`
- `/Users/sidhartharora/dev/claude/insightsloop/skills/insight-sentinel/SKILL.md`
- `/Users/sidhartharora/dev/claude/insightsloop/skills/insight-storm/SKILL.md`
- `/Users/sidhartharora/dev/claude/insightsloop/skills/insight-monkey/SKILL.md`
- `/Users/sidhartharora/dev/claude/insightsloop/skills/insight-plan/SKILL.md`
- `/Users/sidhartharora/dev/claude/insightsloop/skills/insight-devloop/reference/monkey-brief-template.md`

## Challenge

### What could go wrong

1. **Verbatim SKILL.md paste bloats Agent context.** Full SKILL.md files are ~80 lines each. With brief file + SKILL.md, each Agent gets ~150-200 lines of prompt. This is manageable but worth monitoring — if persona files grow, context pressure increases.

2. ~~**Brief files create a temp file management problem.**~~ **Resolved:** Brief files use explicit naming convention (`brief-<crew>-<mode>.md`) and are in the archive discard list. See Change A.

3. ~~**Storm Fix Mode correlated failure.**~~ **Resolved:** Fix pipeline split into three agents (Storm specs → Sentinel tests → Shipwright patches). Storm never writes tests or code for her own findings. See Change F.

4. **Greenfield detection for unlisted stacks.** The "Other" category relies on general knowledge + user confirmation. The user gate prevents bad checklists from propagating, but the checklist quality depends on the LLM's knowledge of that stack.

5. **Acceptance tests for non-web projects.** The ATDD format assumes page-level rendering. For CLI tools, APIs, or libraries, "acceptance" means something different. Sentinel needs guidance: "For non-UI stories, acceptance tests verify the public interface, not a rendered page."

6. **Monkey + Storm on plan doubles plan review time.** Two parallel Agents instead of one. Acceptable tradeoff for coverage, but worth noting the cost.

7. **Fix pipeline is three sequential agents.** Storm Fix Spec → Sentinel regression tests → Shipwright patches. This is slower than the original single-agent Fix Mode. Acceptable tradeoff for correctness — correlated failure is worse than latency. The three agents can't parallelize because each depends on the previous output.

8. ~~**Wiring verification heuristics are framework-specific.**~~ **Resolved:** Detection is now stack-agnostic — checks for dependency manifests, entry points, and configs generically. Checklist is derived from plan's Architecture section, not hardcoded per framework.

9. **Conceptual findings never get auto-fixed.** Findings prefixed `[concept]` go to Backlog. If most Monkey findings are conceptual, the fix pipeline handles very few items. This is correct behavior (conceptual findings need human judgment) but worth noting — the auto-fix pipeline may appear underutilized.
