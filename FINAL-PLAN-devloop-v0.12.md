# DevLoop v0.12 — Final Plan

Consolidated from: original proposal, R1-R9 revisions, gap analysis. Ready for implementation.

---

## 1. Init Step — New Crew Member

### Identity

| Field | Value |
|-------|-------|
| Skill | `/insight-init` |
| Persona | Bosun |
| Model | Sonnet |
| Tools | Bash (shell access required) |
| Inputs | Plan's Architecture section (stack, dependencies, file structure) |
| Outputs | Bootable project skeleton — `npm run dev` (or equivalent) starts without errors |
| Invoked by | Orchestrator (when greenfield detected), or standalone |

### What Init Does

- Runs ecosystem scaffold CLI (`npx create-next-app@latest`, `cargo init`, `poetry new`, etc.)
- Installs all planned dependencies via package manager (`npm install <pkg>`, `cargo add <pkg>`, etc.)
- Creates framework config files that the scaffold CLI generates
- Verifies the project boots (dev server starts or build compiles without errors)

### What Init Does NOT Do

- Create `.env` files or manage secrets (manual / CI concern)
- Set up CI/CD pipelines (`.github/workflows`, etc.)
- Create or run database migrations (migration tooling is implementation)
- Write application code or test files (Sentinel stubs + Shipwright implementation)
- Configure deployment targets (Docker, Railway, Vercel)
- Create IDE configuration (`.vscode`, `.idea`)
- Modify an existing project's structure

**Boundary rule:** If it requires a human decision (which DB? which env vars? which deploy target?), Init doesn't touch it. If a CLI resolves it from the registry, Init runs the CLI.

### The Iron Rule — No Agent Writes a Version Number From Memory. Ever.

**Decision tree:**

```
Need a dependency?
  CLI "add" command exists? → Run it. Done.
  Plan specifies version constraint? → Pass it: npm install react@18
  Dependency exists elsewhere in monorepo? → Match that version
  No CLI command (Java/Swift/Elixir)? → Query registry API or write without version + TODO
  CLI fails (network/auth)? → STOP. Report. Never guess.
```

**Ecosystems with CLI "add" (~85% coverage):**
Node (npm/yarn/pnpm/bun), Python (poetry/uv/pipenv), Rust (cargo), Go (go get), Ruby (bundle), .NET (dotnet), PHP (composer)

**Ecosystems requiring fallback (~15%):**
Java (Maven/Gradle), Swift (SPM), Elixir (Mix) — query registry API or write `TODO: resolve version`

**Execution caveat (R9):** The Iron Rule requires shell access to a package registry. If the CLI fails with a network or permissions error, Init STOPS and reports: "Cannot resolve dependencies — no registry access. Scaffold manually or fix network access." A blocked Init is better than a broken Init.

### Atomicity — Step Reporting, Not Rollback

Init runs 3 steps. Each is independently verifiable:

| Step | Action | Verification |
|------|--------|-------------|
| 1. Scaffold | Run ecosystem CLI | Entry point file exists |
| 2. Install | Run package manager | Lock file exists |
| 3. Boot | Start dev server / compile | Process exits cleanly (or starts and responds) |

If step 2 fails, step 1's scaffold still exists. The orchestrator's mechanical gate catches the failure. Init reports step-by-step status:

```
Init report:
  Scaffold: done (next.config.ts exists)
  Install: failed (npm ERR! ENETWORK)
  Boot: skipped
```

**Idempotence:** Running Init twice doesn't break things. CLI scaffolders handle existing directories, `npm install` is idempotent.

### Responsibility Split

| Concern | Owner | What they do |
|---------|-------|-------------|
| Project scaffolding | **Init** | Ecosystem CLI, dependency install, config files, boot check |
| Test stubs + types | **Sentinel** | Empty component/route exports, shared type definitions — minimum for tests to compile. Does NOT create package.json, tsconfig, jest config, or any infrastructure |
| Implementation | **Shipwright** | Implements against existing scaffolding. May add new packages via CLI but never creates manifests from scratch |

---

## 2. Orchestrator Flow Changes

### Greenfield Detection Moves to Orchestrator (R4)

Frame no longer does greenfield detection. The Quartermaster no longer produces scaffolding checklists. Detection happens before devloop starts:

```
Orchestrator pre-check:
1. Does dependency manifest exist? (package.json / Cargo.toml / pyproject.toml)
   AND does source directory exist? (src/ / lib/ / app/)
     YES → Non-greenfield. Skip Init. Proceed to Frame.
     NO  → Greenfield. Run Init. Verify gate. Proceed to Frame.
```

**Non-greenfield path (the common case):** Init is skipped entirely. Frame assumes project exists. If manifest or lock file is missing in a non-greenfield project, that's a user problem — devloop doesn't attempt to fix it.

**Greenfield path:** Orchestrator → Init → mechanical gate → Frame → rest of devloop.

### Init → Sentinel Mechanical Gate (R5)

Before invoking Sentinel, the orchestrator verifies:

```
1. Dependency manifest exists (package.json / pyproject.toml / Cargo.toml)
2. Lock file exists (package-lock.json / poetry.lock / Cargo.lock)
3. Test framework installed (node_modules/.bin/jest or equivalent)

If ANY check fails:
  "Project not scaffolded. Run /insight-init or install dependencies manually."
  Do NOT proceed to Sentinel.
```

This makes the Init → Sentinel dependency mechanical, not prose-based. Even if Init is removed in a future refactor, the gate catches missing infrastructure.

### Init in Devloopfast (Gap 5)

Devloopfast gets the same greenfield pre-check as devloop. Init can't be skipped — without scaffolding, nothing compiles. Init is inherently fast (CLI commands, Sonnet model, no judgment).

---

## 3. Triage + Agent Selection

### Mechanical Triage Criteria (Revised)

**Count integration seams + new patterns:**

**Integration seam** = boundary where your code talks to something it doesn't own:
- External API call
- Database table (read or write)
- Auth / session boundary
- File system I/O
- Message queue / event bus
- Third-party service SDK

**New pattern** = architectural approach not already established in the codebase:
- New state management (adding Redux to a Context project)
- New data fetching approach (adding tRPC to a fetch project)
- New auth scheme
- New rendering strategy (adding SSR to client-only app)

**Sum = seams + new patterns:**

| Sum | Triage | Example |
|-----|--------|---------|
| 0-1 | **Small** | Recipe search page calling 1 API. Static landing page. New component on existing page. Simple CRUD endpoint. |
| 2-3 | **Medium** | Auth system (auth service + session store + protected routes). Dashboard with API + DB + charts. Feature with frontend + backend + shared types. |
| 4+ | **Architectural** | Multi-service orchestration. New auth + new DB + new cache + event system. Public API with schema migrations and multiple consumers. |

**Override rules:**
- Schema migration → at least Medium (regardless of count)
- New public API consumed by external systems → at least Medium
- Greenfield project → bump one tier (existing L-013 rule)

### Lean vs Full Crew (R1 — Storm TDD Restored)

| Agent | Lean | Full |
|-------|------|------|
| Monkey at Frame | Yes | Yes |
| Sentinel (TDD) | Yes | Yes |
| Storm TDD Review | **Yes** | Yes |
| Shipwright (Build) | Yes | Yes |
| Storm Verify | Yes | Yes |
| Cartographer | **No** | Yes |
| Build Monkey | **No** | Yes |

**Lean skips 2 agents.** Overhead reduction ~25% vs full crew.

**What Lean accepts as risk (R7):**
> Lean crew skips Build Monkey and Cartographer. This means: (1) implementation-level VALUES violations (over-abstraction, dead code, unnecessary complexity) are not caught during build, and (2) exhaustive edge case path enumeration is not performed. These are deferred to `/insight-retro` or manual review. This is an accepted tradeoff for Small features where the code surface is limited.

### Lean is Default for Small — No User Gate (R2)

Lean is automatic for Small triage. No choice gate. The user can override at the existing Frame approval gate:

```
Triage: Small. Lean crew — Monkey Frame → Sentinel → Storm TDD → Shipwright → Storm Verify.

Options:
  - Approve (Recommended)
  - Approve with full crew — adds Cartographer + Build Monkey
  - Adjust — change triage or scope
  - Abort — back to plan
```

One gate, not two. Medium and Architectural always get full crew — no option shown.

### Convergence Gate Adapts to Crew (R6)

**Full crew:**
```
Storm: [N] issues. Cartographer: [N] edge cases. Monkey: [N] findings across [M] verticals.

Options: Proceed to fix pipeline | Discuss | Abort
```

**Lean crew:**
```
Storm: [N] issues. (Cartographer and Build Monkey skipped — Lean crew.)

Note: Lean did not run exhaustive path enumeration or implementation-level chaos.
Recommendation: Run /insight-retro after merge.

Options: Proceed to fix pipeline | Escalate to full crew | Discuss | Abort
```

The "Escalate to full crew" option lets the user add Cartographer + Build Monkey at this point if Storm's findings suggest the feature is more complex than expected. The retro nudge makes the gap visible at the decision point.

---

## 4. Sentinel Scope Fixes

### 4a. Exclude Infrastructure Files

Add to Sentinel SKILL.md rules:

> Do NOT create package.json, tsconfig.json, jest.config.ts, tailwind.config.ts, next.config.ts, or any infrastructure/config files. These are Init's responsibility. Write minimum stubs for application code only: empty component exports, empty route handlers, shared type definitions. If tests need a testing library import, assume it is already installed.

### 4b. Acceptance Test Dedup

Add to Sentinel SKILL.md method section:

> Acceptance tests verify cross-component integration — the full user flow works end-to-end. They are NOT duplicates of component tests at a higher render level. If a behavior is tested at the component level (button states, input validation, error display), do NOT duplicate it in acceptance tests. Aim for 3-5 acceptance contracts that exercise the complete page flow: render → interact → verify outcome. Unit behaviors belong in component tests only.

### 4c. Assertion Specificity

Add to Sentinel SKILL.md rules:

> Numeric assertions must not match incidentally. `expect(screen.getByText(/3/))` matches any element containing '3' — an id, a count, a date. Use specific patterns: `expect(screen.getByText('3 of 4'))`, or `expect(screen.getByTestId('match-count')).toHaveTextContent('3')`. Every assertion must fail if the implementation is wrong, not just if the implementation is missing.

---

## 5. Re-scope Gate — Categorized Findings

### Frame Monkey Findings Categorization (R8)

When presenting Frame Monkey findings, the orchestrator categorizes before showing the user:

```
Monkey challenged the plan across [N] verticals. Findings:

Must fix (plan broken without these):
  #6 — Cook time not in API response
  #10 — No shared type contract

Should fix (improves quality):
  #7 — Input bounds validation
  #12 — Response transformation

Backlog (nice to have):
  #4 — Repeated params edge case
  #9 — NEXT_PUBLIC_ prefix documentation

Options:
  - Apply must-fix + should-fix (Recommended)
  - Apply must-fix only
  - Apply all
  - Discuss
```

**Categorization criteria:**
- **Must fix** — plan is broken, build will fail or produce wrong output
- **Should fix** — VALUES violation, missing validation, coupling concern
- **Backlog** — edge case for unlikely scenario, documentation improvement

### Stage Clarification (R8)

> This categorization applies to Frame Monkey findings only (plan-level). Code-level findings from Ship use the existing fix dispatch matrix (critical/high/medium/low). Mapping: must-fix ~ critical/high, should-fix ~ medium, backlog ~ low.

---

## 6. Shipwright Dependency Rules (Expanded)

Add to Shipwright SKILL.md:

> **Dependency management during build:**
>
> If you need a package that isn't installed:
> 1. Run `npm install <pkg>` (or ecosystem equivalent: `cargo add`, `poetry add`, etc.)
> 2. For dev-only dependencies (test utilities, linters, type stubs): use `npm install -D <pkg>`
> 3. Check CLI output for peer dependency warnings or version conflicts. If any appear, STOP and report the conflict — do not use `--force` or `--legacy-peer-deps`
> 4. Never write version numbers into manifest files by hand
> 5. If the CLI fails (network, permissions, registry), STOP and report — do not fall back to guessing
>
> You may add packages. You may never create or rewrite manifest files (package.json, Cargo.toml, etc.)

---

## 7. Quartermaster Changes

Remove greenfield detection from Quartermaster SKILL.md:

**Remove:** Step 7 (greenfield detection, scaffolding checklist generation, Task 0 scaffolding)

**Remove from output format:** Scaffolding Checklist section in frame.md

**Add to prerequisites:** "Assumes project is scaffolded. If the project was greenfield, Init has already run."

The Quartermaster's 7-step method becomes 6 steps:
1. Read plan
2. Explore codebase
3. Decompose into atomic tasks
4. Assign worktrees
5. Map test files
6. Sharpen acceptance criteria

Greenfield scaffolding is Init's job. Frame decomposition is the Quartermaster's job. No overlap.

---

## 8. Resume Capability — Run State Detection

### Problem

When a devloop run gets interrupted (context limit, crash, user pauses), the run state lives in `.insightsLoop/current/` artifacts but there's no way to pick up where you left off. The user has to start over or manually figure out which step to re-run.

### Design

Add a state detection check at the start of devloop (Step 0.5, after value load, before Frame). The orchestrator reads `.insightsLoop/current/`, matches artifacts against a lookup table, and infers the last completed step.

**Artifact → State lookup:**

| Artifacts found | Last completed step | Resume from |
|----------------|-------------------|-------------|
| Nothing | No active run | Start fresh |
| `plan.md` only | Plan loaded | Step 1a (Quartermaster) |
| `frame.md` | Quartermaster done | Step 1b (Frame Monkey) |
| `monkey-frame.md` | Frame complete | Step 2a (Sentinel) |
| `storm-tdd.md` | TDD reviewed | Step 2b (Shipwright) |
| `storm-report.md` | Ship analysis done | Step 3c (Convergence gate) |
| `findings-consolidated.md` | Convergence done | Step 3d (Fix pipeline) |
| `summary.md` | Run complete | Nothing to resume |

**Gate presented to user:**

```
Active run detected. Last completed: Frame (monkey-frame.md exists).

Options:
  - Resume → continues from Build (Step 2a)
  - Start fresh → archives current to run-NNNN, begins new run
  - Abort
```

### Rules

- Detection is artifact-based, not state-file-based. No new files to maintain — the artifacts ARE the state.
- If artifacts are inconsistent (e.g., `storm-report.md` exists but `frame.md` doesn't), warn and offer Start fresh only.
- Archive on "Start fresh" uses the same archive logic as Step 3e (move to `run-NNNN-name/`).
- Resume skips already-completed steps entirely — does not re-run them.
- Devloopfast gets the same detection logic.

### Cost

Near zero runtime. File existence check (`ls .insightsLoop/current/`), table lookup, one user gate. No extra agent calls.

### Implementation

~30 lines added to devloop SKILL.md (Step 0.5) + same for devloopfast. No new skills, no new files.

### Where it goes in the flow

After Step 0 (Load Values), before Step 1 (Frame). If resume is chosen, the orchestrator jumps to the inferred step. If start fresh, archives and proceeds to Step 1 normally.

---

## 9. Theme Gap Fill — 6 Missing Moments

v0.11 added the Quartermaster but never updated the theme files. v0.12 adds Init, Resume, Triage, Re-scope, and Lean Convergence — all without themed voice. Every gap = the orchestrator falls back to plain English.

### New Moments to Add (all 3 themes)

#### Pirate

| Moment | Message |
|--------|---------|
| Quartermaster starts | *The Quartermaster clears the table. Charts, dividers, manifest. Every task gets a berth.* |
| Quartermaster done | *Manifest written. Every hand knows their watch.* |
| Resume detected | *There's a half-rigged ship in the dry dock. Someone left mid-voyage.* |
| Resume accepted | *Back aboard. Picking up where the last watch left off.* |
| Start fresh (archive) | *Stowing the old charts. Fresh canvas on the table.* |
| Init starts | *Laying the keel. Timber, nails, tar — the shipyard does the rest.* |
| Init done | *She floats. No cargo, no crew, but she floats.* |
| Init failed | *The keel cracked. Can't sail what won't float.* |
| Triage: Lean crew | *Small waters. Skeleton crew — enough hands, no dead weight.* |
| Triage: Full crew | *Deep waters ahead. All hands on deck.* |
| Re-scope: must-fix | *The hull's got holes. These get patched before we sail.* |
| Re-scope: should-fix | *Not holes, but soft planks. Fix 'em while the tar's hot.* |
| Re-scope: backlog | *Notes for the next refit. Stow 'em in the hold.* |
| Convergence (Lean) | *Inspection done. No reef map, no barrel check — skeleton crew. Run the captain's log after we make port.* |

#### Space

| Moment | Message |
|--------|---------|
| Quartermaster starts | *The Quartermaster pulls up the work allocation console. Every task gets a bay assignment.* |
| Quartermaster done | *Work orders filed. Every engineer has a station.* |
| Resume detected | *Active mission in the flight recorder. Someone ejected mid-run.* |
| Resume accepted | *Re-engaging. Resuming from last telemetry checkpoint.* |
| Start fresh (archive) | *Archiving flight data. Wiping the mission board.* |
| Init starts | *Fabricating the chassis. Frame, power, life support — the shipyard handles it.* |
| Init done | *Chassis is live. No modules, no payload, but she powers on.* |
| Init failed | *Chassis won't boot. Can't fly what won't power.* |
| Triage: Lean crew | *Short-range mission. Reduced crew complement — efficient, not reckless.* |
| Triage: Full crew | *Deep-range survey. Full crew complement.* |
| Re-scope: must-fix | *Structural failures. These get sealed before we hit vacuum.* |
| Re-scope: should-fix | *Non-critical anomalies. Repair while the bay is pressurized.* |
| Re-scope: backlog | *Logged for next maintenance window. Stowed in cargo.* |
| Convergence (Lean) | *Diagnostics complete. No field map, no duct crawl — reduced crew. Run the debrief after docking.* |

#### Naval

| Moment | Message |
|--------|---------|
| Quartermaster starts | *The Quartermaster opens the duty roster. Every task gets an assignment and a deadline.* |
| Quartermaster done | *Duty roster posted. Every station manned.* |
| Resume detected | *Incomplete engagement in the log. Someone left the bridge mid-operation.* |
| Resume accepted | *Resuming operations. Picking up from last standing order.* |
| Start fresh (archive) | *Filing the previous engagement. Clean slate on the board.* |
| Init starts | *Commissioning the vessel. Hull, engines, systems — the yard does it by the book.* |
| Init done | *Commissioned. No armament, no crew, but she's seaworthy.* |
| Init failed | *Failed sea trials. She doesn't leave the yard.* |
| Triage: Lean crew | *Routine patrol. Reduced watch — disciplined, not understaffed.* |
| Triage: Full crew | *Combat operations. All stations manned.* |
| Re-scope: must-fix | *Critical damage. Repair before we're underway.* |
| Re-scope: should-fix | *Maintenance items. Handle while we're in port.* |
| Re-scope: backlog | *Noted for next refit cycle. Filed in stores.* |
| Convergence (Lean) | *Inspection complete. No minefield chart, no engine room check — reduced watch. File the after-action report post-deployment.* |

### Implementation

Add these rows to the `DevLoop` orchestrator voice table in each theme file (`themes/pirate.md`, `themes/space.md`, `themes/naval.md`). No structural changes — just new rows in existing tables.

### Where in devloop SKILL.md

The theme loading instructions already say "MANDATORY — every transition gets a message." The gap was missing messages, not missing instructions. Once the rows exist, the orchestrator will use them.

---

## 10. Brief Templates — Mechanical Brief Construction

### Problem

The orchestrator currently builds agent briefs by following prose instructions ("paste SKILL.md verbatim, write context to brief files"). This means the LLM reads SKILL.md, interprets the instructions, and writes the brief — burning tokens to do what string replacement could do. It also invites L-008 violations (paraphrasing instead of pasting).

### Design

Pre-built templates with `{{SLOT}}` placeholders. The orchestrator reads the template, reads each source file, does string replacement, writes the filled brief. Zero LLM interpretation.

**Location:** `skills/insight-devloop/brief-templates/`

### Template Structure

Every brief follows the same skeleton:

```markdown
{{THEME_OPENER}}

{{SKILL_MD}}

## Project Values

{{VALUES_MD}}

## Context

{{DYNAMIC_SLOTS}}
```

`THEME_OPENER`, `SKILL_MD`, and `VALUES_MD` are the same across all briefs (just different SKILL.md per agent). The dynamic slots vary per agent and per step.

### Templates (8 files)

#### `quartermaster.md`
```
{{THEME_OPENER}}
{{SKILL_MD}}

## Project Values
{{VALUES_MD}}

## Plan
{{PLAN_MD}}
```

#### `sentinel.md`
```
{{THEME_OPENER}}
{{SKILL_MD}}

## Project Values
{{VALUES_MD}}

## Plan Context
Intent: {{PLAN_INTENT}}
Out of Scope: {{PLAN_OUT_OF_SCOPE}}
Architecture: {{PLAN_ARCHITECTURE}}
Tasks: {{PLAN_TASKS}}
Key Files: {{PLAN_KEY_FILES}}

## Acceptance Criteria
{{SHARPENED_ACCEPTANCE_CRITERIA}}

## Test Framework
{{TEST_FRAMEWORK_INFO}}

## TDD Matrix
{{TDD_MATRIX_MD}}
```

#### `storm-tdd.md`
```
{{THEME_OPENER}}
{{SKILL_MD}}

## Project Values
{{VALUES_MD}}

## Mode: TDD Review

## Test Files to Review
{{TEST_FILE_PATHS}}

## Acceptance Criteria
{{SHARPENED_ACCEPTANCE_CRITERIA}}
```

#### `shipwright.md`
```
{{THEME_OPENER}}
{{SKILL_MD}}

## Project Values
{{VALUES_MD}}

## Plan Context
{{PLAN_ARCHITECTURE}}

## Your Task
{{TASK_ASSIGNMENT}}

## Failing Tests
{{FAILING_TEST_PATHS}}

## Visual Spec
{{VISUAL_SPEC}}
```

#### `monkey-frame.md`
```
{{THEME_OPENER}}
{{SKILL_MD}}

## Project Values
{{VALUES_MD}}

## Target: Plan + Frame
{{PLAN_MD}}
{{FRAME_MD}}

## Previous Findings
{{PREVIOUS_FINDINGS}}
```

#### `monkey-build.md`
```
{{THEME_OPENER}}
{{SKILL_MD}}

## Project Values
{{VALUES_MD}}

## Target: Merged Diff
{{MERGED_DIFF}}

## Previous Findings (Frame)
{{MONKEY_FRAME_FINDINGS}}
```

#### `storm-verify.md`
```
{{THEME_OPENER}}
{{SKILL_MD}}

## Project Values
{{VALUES_MD}}

## Mode: Verify

## Merged Diff
{{MERGED_DIFF}}

## Previous Findings
{{ALL_PREVIOUS_FINDINGS}}
```

#### `cartographer.md`
```
{{THEME_OPENER}}
{{SKILL_MD}}

## Project Values
{{VALUES_MD}}

## Files to Map
{{CHANGED_FILE_PATHS}}

## Merged Diff
{{MERGED_DIFF}}
```

### Slot Resolution Table

How the orchestrator fills each slot — all file reads, no LLM:

| Slot | Source |
|------|--------|
| `{{THEME_OPENER}}` | Read theme file → extract persona opener for this agent |
| `{{SKILL_MD}}` | Read `skills/insight-{agent}/SKILL.md` |
| `{{VALUES_MD}}` | Read `VALUES.md` from project root |
| `{{PLAN_MD}}` | Read `.insightsLoop/current/plan.md` |
| `{{PLAN_INTENT}}` | Extract `## Intent` section from plan.md |
| `{{PLAN_OUT_OF_SCOPE}}` | Extract `## Out of Scope` section from plan.md |
| `{{PLAN_ARCHITECTURE}}` | Extract `## Architecture` section from plan.md |
| `{{PLAN_TASKS}}` | Extract `## Tasks` section from plan.md |
| `{{PLAN_KEY_FILES}}` | Extract `## Key Files` section from plan.md |
| `{{SHARPENED_ACCEPTANCE_CRITERIA}}` | Extract from `.insightsLoop/current/frame.md` |
| `{{FRAME_MD}}` | Read `.insightsLoop/current/frame.md` |
| `{{TASK_ASSIGNMENT}}` | Extract specific task block from frame.md by worktree ID |
| `{{TEST_FRAMEWORK_INFO}}` | Detect from project (jest.config / vitest.config / etc.) |
| `{{TDD_MATRIX_MD}}` | Read `TDD-MATRIX.md` from project root (or empty) |
| `{{TEST_FILE_PATHS}}` | List test files written by Sentinel |
| `{{FAILING_TEST_PATHS}}` | Same as test file paths (pre-implementation, all fail) |
| `{{VISUAL_SPEC}}` | Read `.insightsLoop/current/mockup.html` path (or "none") |
| `{{MERGED_DIFF}}` | Run `git diff` on merged worktree changes |
| `{{CHANGED_FILE_PATHS}}` | Run `git diff --name-only` |
| `{{PREVIOUS_FINDINGS}}` | Read all `monkey-*.md` + `storm-*.md` from current/ |
| `{{MONKEY_FRAME_FINDINGS}}` | Read `.insightsLoop/current/monkey-frame.md` |
| `{{ALL_PREVIOUS_FINDINGS}}` | Concatenate all findings files from current/ |

### Orchestrator Instructions Change

Replace the current prose-based brief construction in devloop SKILL.md with:

> **Brief construction is mechanical.** Read the template from `brief-templates/{agent}.md`. Fill each `{{SLOT}}` by reading the source file listed in the slot resolution table. Write the filled brief to `.insightsLoop/current/brief-{agent}.md`. Pass the brief file path to the agent. Do NOT paraphrase, summarize, select, or interpret — the template defines what goes in, you just fill it.

### What This Kills

- L-008 violations (paraphrasing SKILL.md) — impossible, template pastes verbatim
- Orchestrator token burn on brief construction — mechanical, not generative
- Brief inconsistency between runs — same template, same output
- Missing context — if a slot is in the template, it gets filled. No "forgot to include the plan"

### Cost

8 template files, ~15 lines each. One paragraph change in devloop SKILL.md + devloopfast SKILL.md. The slot resolution table is documentation for the orchestrator — it doesn't need to be a separate file, it lives in the devloop SKILL.md.

---

## 11. Summary Returns — Agents Return Summaries, Not Full Output

### Problem

Agents return full output to the orchestrator (100-200 lines per agent). By Ship step, the orchestrator holds ~1500 lines of accumulated findings it never uses directly. The next agent reads findings from files anyway.

### Rule for Each Crew SKILL.md

> "Return a structured summary to the orchestrator: finding count, then one entry per finding — number, title, category (must-fix/should-fix/backlog or severity), confidence score, target location, consequence (one sentence), and impact (one sentence). Write full detail (technique, full observation, guard snippets, survived/didn't survive) to the artifact file only. The orchestrator routes on summaries. The next agent reads from files."

### Return Format

```
[N] findings across [M] verticals

#1 — [title] [category] confidence: [N]
     Target: [location]
     [consequence]
     [impact]

#2 — ...

Written to [artifact-file].md
```

~4 lines per finding. 5 findings = ~25 lines returned to orchestrator instead of ~200.

### Which Agents This Applies To

| Agent | Returns summary | Writes full to |
|-------|----------------|---------------|
| Quartermaster | Triage level + task count + worktree count | `frame.md` |
| Monkey (Frame) | Findings with category/confidence/target/consequence/impact | `monkey-frame.md` |
| Monkey (Build) | Same format | `monkey-build.md` |
| Sentinel | Test count + file list | test files (already does this) |
| Storm TDD | Findings with severity/confidence/target/consequence/impact | `storm-tdd.md` |
| Storm Verify | Same format | `storm-report.md` |
| Cartographer | Edge case count + unguarded path count | `edge-cases.md` |
| Shipwright | Pass/fail + test count + files changed | committed code |

### Impact

Orchestrator context by Ship step: ~175 lines (summaries) instead of ~1500 lines (full output). Combined with brief templates (§10), total orchestrator token usage drops to roughly 1/4 of v0.11.

---

## 12. Quartermaster Owns Plan Corrections

### Problem

In v0.11, the orchestrator manually edited plan.md after the re-scope gate to apply Monkey findings. "Orchestrator NEVER writes code" — but plan.md is a gray area. The orchestrator was making judgment calls about how to resolve findings (drop a field, add an interface). That's interpretation, not routing.

### Change

After the re-scope gate, the Quartermaster applies plan corrections — not the orchestrator.

**Flow:**
1. Orchestrator presents categorized Monkey findings at re-scope gate
2. User selects which to apply (must-fix + should-fix, must-fix only, all, etc.)
3. Orchestrator passes selected findings to Quartermaster: "Apply these corrections to plan.md"
4. Quartermaster edits plan.md and re-runs decomposition (updated frame.md)
5. Orchestrator presents updated frame for approval

**Add to Quartermaster SKILL.md:**

> **Plan correction mode.** When invoked with selected Monkey findings, apply corrections to plan.md: update Architecture, Tasks, Acceptance Criteria, and Key Files to resolve each finding. Then re-decompose into an updated frame.md. Do not add scope — only resolve the specific findings. If a finding requires a scope decision (new component vs extending existing), present the options and ask.

**Add to devloop SKILL.md (Step 1c re-scope gate):**

> After user selects findings to apply, invoke the Quartermaster in plan correction mode. Do not edit plan.md yourself. Pass the selected findings and the current plan.md path. The Quartermaster returns an updated frame.md.

### Why This Matters

- Orchestrator stays a pure router — no judgment calls
- Quartermaster already understands plan structure (it decomposes them)
- Plan corrections are decomposition-adjacent — same skill, same agent
- Eliminates the gray area: plan editing IS the Quartermaster's job
- **Accepted risk:** The Monkey does not re-run on the corrected plan. Corrections are scoped to approved findings only. If a correction introduces a new issue, Storm Verify catches it at Ship step (it reviews the full merged diff). Re-running Monkey after every correction would double Frame cost for marginal gain.

---

## 13. Monkey Findings Config — Small Triage Gets 2/Vertical

### Problem

Monkey produced 12 findings for a 7-file Small feature. The top 2 per vertical contained every finding that drove a plan correction. The bottom 4 (conf < 70) were design opinions and cosmetic edge cases.

### Change

Monkey `findings_per_step` becomes triage-aware:

| Triage | Findings per vertical |
|--------|----------------------|
| Small | 2 |
| Medium | 3 (current default) |
| Architectural | 3 |

### Where

- **Config:** `.insightsLoop/config.md` gets a new section:
  ```
  ## Monkey
  - findings_per_step_small: 2
  - findings_per_step_default: 3
  ```

- **Monkey brief:** The orchestrator passes the triage level in the brief. The Monkey reads it and caps output accordingly.

- **Brief template update:** `monkey-frame.md` and `monkey-build.md` templates get a new slot:
  ```
  ## Triage
  {{TRIAGE_LEVEL}}
  ```

- **Monkey SKILL.md:** Add rule:
  > "Read the Triage level from your brief. If Small, produce up to 2 findings per vertical. If Medium or Architectural, produce up to 3. Prioritize by confidence — highest confidence findings first."

### Impact

Small: 8 findings max (2 × 4 verticals) instead of 12. Re-scope gate is 33% lighter. Every finding that mattered in the test run would still be caught (top-2 per vertical covered all plan corrections).

---

## 14. Quartermaster Uncertainty Section

### Problem

Quartermaster produced "Concerns: None" in its first frame — the Monkey rightfully called this overconfident. The Quartermaster can't verify API response shapes, third-party behavior, or runtime constraints from static analysis alone.

### Change

Add to Quartermaster SKILL.md output format:

> **Uncertainties** (required section in frame.md). List 1-3 things you cannot verify from the plan and codebase alone. Examples: API response shape not confirmed, third-party rate limits unknown, runtime performance of N+1 query pattern. "Concerns: None" is not acceptable — if you found nothing, you didn't look hard enough.

### frame.md Addition

```
## Uncertainties
- [ ] API response shape for /recipes/findByIngredients not verified against live endpoint
- [ ] Rate limit behavior of Spoonacular free tier under concurrent requests unknown
```

These feed into the Monkey brief as additional targets — the Monkey knows where the Quartermaster couldn't verify, and can focus there.

---

## 15. New Devloop Flow (v0.12)

### Full Sequence

```
                        ┌─────────────────────────┐
                        │    Orchestrator Start    │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │  Greenfield Detection    │
                        │  (manifest + src exist?) │
                        └────┬───────────────┬────┘
                             │               │
                          YES│            NO │
                     (skip Init)      ┌──────▼──────┐
                             │        │  INIT (new) │
                             │        │  Bosun/Son. │
                             │        └──────┬──────┘
                             │               │
                             │        ┌──────▼──────┐
                             │        │ Init Gate   │
                             │        │ manifest?   │
                             │        │ lock file?  │
                             │        │ test fwk?   │
                             │        └──────┬──────┘
                             │               │
                        ┌────▼───────────────▼────┐
                        │  STEP 0: Load Values    │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │  STEP 0.5: Resume Check │
                        │  (artifacts in current/)│
                        └───┬───────────────┬─────┘
                            │               │
                      No active run   Active run
                            │         ┌─────▼─────┐
                            │         │Resume gate │
                            │         └──┬──┬──┬──┘
                            │   Resume──┘  │  └──Abort
                            │  (jump to  Fresh
                            │   step N) ┌──▼──┐
                            │           │Arch.│
                            │           └──┬──┘
                            │              │
                        ┌───▼──────────────▼──────┐
                        │  STEP 1: FRAME          │
                        │  1a. Quartermaster      │
                        │      (6-step, no gfield)│
                        │  1b. Monkey (all vert.) │
                        │  1c. Re-scope gate      │
                        │      (categorized)      │
                        │  1d. Triage gate        │
                        │      (Small=lean default)│
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │  Sentinel Gate          │
                        │  (manifest + lock +     │
                        │   test framework check) │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │  STEP 2: BUILD (ATDD)   │
                        │  2a. Sentinel (TDD)     │
                        │    + Storm TDD Review   │
                        │  2b. Shipwright          │
                        │      (parallel worktrees)│
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │  STEP 3: SHIP           │
                        │  3a. Merge worktrees    │
                        │  3b. Analysis:          │
                        │    Storm Verify         │
                        │    + Cartographer (Full) │
                        │    + Build Monkey (Full) │
                        │  3c. Convergence gate   │
                        │      (adapts to crew)   │
                        │  3d. Fix pipeline       │
                        │  3e. Archive            │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │  DONE                   │
                        │  (retro nudge if Lean)  │
                        └─────────────────────────┘
```

### What Changed vs v0.11

| Component | v0.11 | v0.12 |
|-----------|-------|-------|
| Greenfield detection | Quartermaster (step 7) | Orchestrator pre-check |
| Scaffolding | Quartermaster Task 0 | Init (new step) |
| Dependency versions | Agents wrote from memory | Iron Rule — CLI only |
| Triage criteria | Prose-based | Mechanical (seam + pattern count) |
| Small triage | Full crew | Lean crew default (skip 2 agents) |
| Lean/Full choice | User gate (proposed, then cut) | Auto-lean with escape hatch at Frame gate |
| Frame Monkey findings | All-or-nothing re-scope | Categorized: must-fix / should-fix / backlog |
| Storm TDD Review in Lean | Removed (proposed), restored (R1) | Always present |
| Convergence gate | Fixed format | Adapts to crew, retro nudge for Lean |
| Sentinel scope | Could create infra files | Explicitly banned from infra files |
| Sentinel assertions | Any regex | Must not match incidentally |
| Sentinel acceptance tests | Could duplicate unit tests | Dedup guidance added |
| Shipwright deps | One-line rule | Full protocol (devDeps, conflicts, stop-on-warning) |
| Quartermaster | 7 steps (with greenfield) | 6 steps (no greenfield) |
| Init → Sentinel | Prose dependency | Mechanical gate (3 checks) |
| Build Monkey skip (Lean) | Implicit | Explicitly stated risk with retro nudge |
| Run resume | Not possible — start over | Artifact-based state detection, resume from last step |
| Brief construction | LLM-generative, prose instructions | Mechanical templates with {{SLOT}} replacement |
| Agent returns | Full output to orchestrator | Structured summary (~25 lines), full detail to file |
| Plan corrections after Monkey | Orchestrator edits plan (gray area) | Quartermaster owns plan corrections |
| Monkey findings (Small) | 3/vertical (12 total) | 2/vertical (8 total), top confidence first |
| Quartermaster concerns | "Concerns: None" allowed | Required Uncertainties section, minimum 1 |

---

## 9. Implementation Sequence

### Files to Create

| # | File | Content |
|---|------|---------|
| 1 | `skills/insight-init/SKILL.md` | Init persona, method, Iron Rule, boundary rules, step reporting, execution caveat |

### Files to Edit

| # | File | Changes |
|---|------|---------|
| 2 | `skills/insight-devloop/SKILL.md` | Greenfield pre-check, Init invocation, Sentinel gate, triage criteria, Lean/Full crew, re-scope categorization, convergence adaptation, retro nudge, Build Monkey risk statement, resume check (Step 0.5) |
| 3 | `skills/insight-devloopfast/SKILL.md` | Same greenfield pre-check + Init + Sentinel gate + resume check as devloop |
| 4 | `skills/insight-sentinel/SKILL.md` | Add: no infra files rule (4a), acceptance test dedup (4b), assertion specificity (4c) |
| 5 | `skills/insight-shipwright/SKILL.md` | Add: dependency management protocol (devDeps, conflicts, stop-on-warning) |
| 6 | `skills/insight-quartermaster/SKILL.md` | Remove: step 7 (greenfield detection), scaffolding checklist output. Add: "assumes project scaffolded" prerequisite, plan correction mode, required Uncertainties section |
| 6b | `skills/insight-monkey/SKILL.md` | Add: triage-aware findings cap (2/vertical for Small), summary return rule |
| 6c | `skills/insight-storm/SKILL.md` | Add: summary return rule |
| 6d | `skills/insight-edge-case-hunter/SKILL.md` | Add: summary return rule |
| 7 | `themes/pirate.md` | Add 14 new orchestrator voice rows (Quartermaster, Resume, Init, Triage, Re-scope, Convergence Lean) |
| 8 | `themes/space.md` | Same 14 rows, space-themed |
| 9 | `themes/naval.md` | Same 14 rows, naval-themed |

### Files to Create (Brief Templates)

| # | File | Content |
|---|------|---------|
| 10 | `skills/insight-devloop/brief-templates/quartermaster.md` | Theme opener + SKILL.md + VALUES + plan |
| 11 | `skills/insight-devloop/brief-templates/sentinel.md` | Theme opener + SKILL.md + VALUES + plan sections + acceptance criteria + test framework |
| 12 | `skills/insight-devloop/brief-templates/storm-tdd.md` | Theme opener + SKILL.md + VALUES + test files + acceptance criteria |
| 13 | `skills/insight-devloop/brief-templates/shipwright.md` | Theme opener + SKILL.md + VALUES + plan + task + tests + visual spec |
| 14 | `skills/insight-devloop/brief-templates/monkey-frame.md` | Theme opener + SKILL.md + VALUES + plan + frame + previous findings |
| 15 | `skills/insight-devloop/brief-templates/monkey-build.md` | Theme opener + SKILL.md + VALUES + diff + frame findings |
| 16 | `skills/insight-devloop/brief-templates/storm-verify.md` | Theme opener + SKILL.md + VALUES + diff + all findings |
| 17 | `skills/insight-devloop/brief-templates/cartographer.md` | Theme opener + SKILL.md + VALUES + file paths + diff |

### Suggested Order

1. **Init SKILL.md** — write from scratch (standalone, no dependencies)
2. **Quartermaster** — remove greenfield (clean break, Init takes over)
3. **Sentinel** — add scope rules (independent, no cross-file deps)
4. **Shipwright** — add dependency rules (independent)
5. **Devloop** — orchestrator changes (depends on Init + Quartermaster being defined)
6. **Devloopfast** — mirror devloop's pre-check changes

### New Learning to Add

After implementation, add to LEARNINGS.md:

> **L-017: Scaffolding Is Infrastructure, Not Decomposition.**
> Version hallucination in run-0004 proved that agents should never write dependency versions from memory. Scaffolding was separated from decomposition (Init owns infrastructure, Quartermaster owns task breakdown) and the Iron Rule enforces CLI-only dependency resolution. The mechanical gate between Init and Sentinel prevents the most expensive failure mode: tests compiling against phantom packages.

---

## 10. Validation — How to Know This Worked

Run a greenfield Small feature through devloop. Success criteria:

1. Init scaffolds via CLI — no version numbers in any agent-written file
2. Triage lands on Small, Lean crew is auto-selected
3. Sentinel writes tests without creating package.json, tsconfig, or jest config
4. Sentinel acceptance tests don't duplicate component-level assertions
5. Frame Monkey findings are categorized (must-fix / should-fix / backlog)
6. Convergence gate mentions skipped agents + retro recommendation
7. Shipwright adds any needed packages via `npm install`, not hand-written
8. The project builds and all tests pass
9. Monkey produces ≤8 findings (2/vertical × 4 verticals) for Small triage
10. All agents return structured summaries — orchestrator context stays under ~200 lines of agent output
11. Quartermaster applies plan corrections after re-scope, not the orchestrator
12. Quartermaster frame.md includes Uncertainties section (no "Concerns: None")
13. Brief files are constructed from templates — no LLM-generated briefs
