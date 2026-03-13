# InsightsLoop (beta 0.10)

An opinionated dev engine for human+AI teams. 10 skills, 8 personas, one pipeline. Structured briefs, greenfield detection, ATDD, 3-agent fix pipeline, and immersive themed orchestration.

```
/insight-plan → /insight-devloop (or /insight-devloopfast) → /insight-retro
```

## Why InsightsLoop

Most AI dev tools give you options. Pick your workflow. Configure your pipeline. Choose your agents. That flexibility is the problem — it's where drift starts.

InsightsLoop takes the opposite approach: **one pipeline, no options.** The engine decides which agents run, what gets reviewed, when chaos hits. You don't configure it. You trust it or you use something else.

This works better for three reasons:

1. **Friction prevents drift.** Every feature passes through gates — TDD contracts, adversarial review, chaos testing. You can't skip them. If everything is going well, nothing is going well. The friction is what keeps your code honest.

2. **Opinions are faster than decisions.** Weekend builders don't have time to evaluate five approaches. The engine picks one — the right one — and you ship. Less deciding, more building.

3. **Quality at the gate, not after the fact.** Untested code doesn't leave the engine. The Monkey breaks what you thought was solid. The Storm finds the leak before production does. By the time code ships, it's been challenged from every angle.

## Values

InsightsLoop ships with default engineering, UX, and security values in [`VALUES.md`](VALUES.md). Every skill loads them before execution. Every agent enforces them. The Monkey uses your values offensively — she catches the crew not following them.

Your project should add its own **Product Values** — the principles that define what your product cares about. Override or extend the defaults by creating a `VALUES.md` at your project's repo root using [AssertValues](https://assertvalues.dev/) or by hand. Project values take precedence over engine defaults.

Optionally add `TDD-MATRIX.md` to define when to test first vs. after — the Sentinel loads it as a gate.

## The Crew

Every step has a persona. These aren't decoration — they define how each agent thinks and what it refuses to compromise on.

| Persona | Role | Skill | Model |
|---------|------|-------|-------|
| **The Navigator** | Veteran planner — leads with constraints, asks the uncomfortable question | `/insight-plan` | Opus |
| **The Sentinel** | Law writer — one clause, one assertion, one unambiguous verdict | `/insight-sentinel` | Opus |
| **The Shipwright** | Stonemason — quiet pride, won't touch what isn't his | `/insight-shipwright` | Sonnet |
| **The Storm** | Hull inspector — presses seams, traces consequences one layer further | `/insight-storm` | Opus |
| **The Cartographer** | Maps every path, marks every cliff — no personality, no opinions | `/insight-edge-case-hunter` | Sonnet |
| **The Monkey** | Enthusiastic chaos — pokes assumptions across every vertical until something wobbles | `/insight-monkey` | Opus |
| **The Helmsman** | Visceral minimalist — "what happens if we remove this?" | `/insight-ux` | Opus |
| **The Lookout** | Sharp record-keeper — "Burned us:" entries, mistakes first | `/insight-retro` | Sonnet |

## The Loop

### Orchestrators

1. **`/insight-plan`** — The Navigator explores the codebase, asks hard questions, designs architecture, writes Acceptance Criteria, then runs Monkey + Storm in parallel to challenge the plan before it ships. Produces `plan.md` (with Challenge section and Acceptance Criteria). Visual Spec section uses explicit MOVE/DELETE/ADD/KEEP instructions — every MOVE implies a DELETE at the source. For UI stories, asks whether to generate a visual HTML mockup (`--mockup` via `/frontend-design`) or keep it structural (ASCII wireframe). **Theme-aware** — Navigator speaks in themed voice between phases, plan content stays plain.

2. **`/insight-devloop`** — The crew takes the charts and builds:
   - **Frame**: Greenfield detection (2-pass: existence + wiring), scaffolding checklist, triage, parallelization plan. **Monkey** challenges the plan across all relevant verticals (Architecture, Data, Security, Integration, Operational) — cheapest place to catch issues.
   - **Build**: The Sentinel writes acceptance tests first (ATDD), then per-task contracts (Opus) → **Storm TDD Review** checks test contracts for gaps → The Shipwright builds (Sonnet, parallel worktrees)
   - **Ship**: Merge → Storm Verify + Cartographer in parallel (both as Agents) → single **Build Monkey** covers all verticals on merged diff → converge → consolidated findings → 3-agent fix pipeline (Storm specs → Sentinel tests → Shipwright patches)
   - **Done**: Write summary, archive run, suggest `/insight-retro`
   - **Brief construction**: Paste SKILL.md verbatim, write context to brief files, present crew output as-is. No paraphrasing.
   - **Theme**: Mandatory orchestrator voice at every step transition. Ship speaks themed, crew speaks plain.
   - **User Gates**: Every decision point uses `AskUserQuestion` — frame approval, Monkey findings, Storm TDD gaps, merge conflicts, post-findings, pre-archive.

3. **`/insight-devloopfast`** — Speed mode. Same crew, same brief construction, same greenfield gate, same ATDD, same Storm TDD Review, same 3-agent fix pipeline. Auto-triages small/medium (no approval gate), confidence-filters all findings at 80+ (Storm, Cartographer, and Monkey). Below-threshold findings saved to `filtered-findings.md`, never discarded. User gates remain for architectural changes, greenfield scaffolding, merge conflicts, and pre-archive confirmation.

### Crew Assignments

| Step | Agent | What it does |
|------|-------|-------------|
| Frame | **Monkey** (all verticals) | Challenges the plan across arch/data/security/integration/ops before code exists |
| TDD | **Storm** (TDD Review) | Adversarial review of Sentinel's test contracts — missing coverage, wrong abstraction |
| Ship | **Storm** (Verify) + **Cartographer** (parallel) | Adversarial code review + edge case enumeration on merged diff |
| Ship | **Monkey** (all verticals) | Single pass across all verticals on merged diff — finds what Storm + Cartographer missed |

### Standalone Crew Skills

Each crew member can be invoked directly for focused work outside the loop:

4. **`/insight-sentinel`** — TDD contract writer. Derives failing test suites from plan intent. Tests behavior, not implementation. Boundary conditions are not optional.

5. **`/insight-shipwright`** — Implementation builder. Makes failing tests pass — fast, clean, no wasted wood. Follows Visual Spec as a hard instruction. Receives mockup as visual reference when available. Invokes `/frontend-design` for UI components, constrained by project values. 3 attempts max.

6. **`/insight-storm`** — Adversarial code reviewer + consistency enforcer. Four modes: Verify (adversarial review + consistency), Plan Review (challenge plan assumptions and acceptance criteria), TDD Review (check test contracts for gaps), and Fix Spec (write fix specifications for Sentinel and Shipwright to implement). Traces inputs, outputs, irreversible decisions, and implicit assumptions. Separates introduced vs pre-existing issues.

7. **`/insight-monkey`** — The Monkey, standalone. Point her at a file, a plan, a diff, or a decision. She picks techniques from her arsenal, applies them across verticals with specificity, and produces structured findings. Not a reviewer — a disruptor.

8. **`/insight-edge-case-hunter`** — The Cartographer maps every code path mechanically. Called at Ship (as an Agent for parallel execution), also standalone. Markdown table output. Empty report is valid.

9. **`/insight-ux`** — The Helmsman. Minimalist UX designer invoked when a story has a user-facing surface. Produces: user goal, flow (max 5 steps), layout (ASCII wireframe or HTML mockup via `--mockup`), cut list, and copy. With `--mockup`, reads existing pages for current design scheme and invokes `/frontend-design` constrained by project values. Mockup saved to `.insightsLoop/current/mockup.html` and passed to the Shipwright as visual contract. Subtract, don't add.

10. **`/insight-retro`** — The Lookout captures what the crew learned. Reads all artifacts including Monkey findings and filtered findings. Evaluates the confidence filter. Looks across multiple runs for patterns. Updates project knowledge.

## Visual Mockup Flow

```
/insight-plan (Phase 4: UI Surface Check)
  → asks: mockup or ASCII?
  → if mockup: /insight-ux --mockup
       → reads existing pages for current scheme
       → reads VALUES.md for constraints
       → invokes /frontend-design (constrained by values + existing scheme)
       → writes .insightsLoop/current/mockup.html
       → user gate: approve / revise / scrap

/insight-devloop (Step 2b: Shipwright brief)
  → passes mockup path to Shipwright (not contents — avoids context bloat)
  → Shipwright reads mockup.html directly when building UI
  → invokes /frontend-design again for production code (with mockup + values + existing pages)

Precedence: VALUES.md > Visual Spec > mockup > existing codebase patterns
```

## The Monkey

The Monkey is what makes InsightsLoop different. She's not a checklist. She's not a second reviewer. She's the Monkey in the machine — endlessly curious, enthusiastically chaotic, twisting every dial she can find. A real Opus agent with eight chaos techniques:

1. **Assumption Flip** — reverse the strongest assumption, see if it holds
2. **Hostile Input** — creative inputs nobody considered (not just null)
3. **Existence Question** — should this thing exist at all?
4. **Scale Shift** — what happens at 10x, 100x, or zero?
5. **Time Travel** — what breaks tomorrow, next year, after a migration?
6. **Cross-Seam Probe** — where two modules meet, what differs?
7. **Requirement Inversion** — what if the user wants the opposite?
8. **Delete Probe** — what happens if you delete this entirely?

She runs twice: at **Frame** (all verticals against the plan — cheap to fix) and at **Build** (all verticals against the merged diff — verification pass). 3 findings per vertical by default (configurable). With 5 verticals, that's 15 findings per invocation. Her output includes a `Survived` field — because resilience confirmed is as valuable as weakness found. She never pokes the same spot twice.

## User Gates

Every decision point in the loop uses the `AskUserQuestion` tool — never plain text output. This makes it unmistakable when the engine needs you.

| Skill | Gate | When |
|-------|------|------|
| `/insight-plan` | Story selection | Phase 1 |
| `/insight-plan` | Mockup or ASCII | Phase 4 (UI stories) |
| `/insight-plan` | Architecture choice | Phase 4 |
| `/insight-plan` | Monkey + Storm plan review | Phase 5 |
| `/insight-plan` | Final plan approval | Phase 6 |
| `/insight-ux` | UX spec review | After 5 sections |
| `/insight-ux` | Mockup review | After `--mockup` HTML |
| `/insight-devloop` | Greenfield scaffolding | Step 1 |
| `/insight-devloop` | Frame approval | Step 1 |
| `/insight-devloop` | Monkey challenges (Survived: no) | Step 1 |
| `/insight-devloop` | Storm TDD gaps (critical/high) | Step 2a |
| `/insight-devloop` | Merge conflicts | Step 3a |
| `/insight-devloop` | Convergence (all findings) | Step 3b |
| `/insight-devloop` | Ship confirmation | Step 3d |
| `/insight-devloopfast` | Greenfield scaffolding | Step 1 |
| `/insight-devloopfast` | Architectural frame only | Step 1 |
| `/insight-devloopfast` | Triage correction | Monkey says size is wrong |
| `/insight-devloopfast` | Merge conflicts, convergence, ship | Steps 3a, 3b, 3d |

## Run History

Every build run is archived in `.insightsLoop/`:

```
.insightsLoop/
├── current/                  ← active run
├── run-0001-embed-widget/    ← archived
│   ├── summary.md
│   ├── plan.md
│   ├── mockup.html                ← if UI story used --mockup
│   ├── scaffolding-checklist.md   ← if greenfield
│   ├── findings-consolidated.md   ← unified findings with status
│   ├── fix-specs.md               ← fix contracts (if pipeline ran)
│   ├── storm-report.md
│   ├── storm-tdd.md               ← Storm's TDD review
│   ├── storm-plan.md              ← if Storm reviewed the plan
│   ├── monkey-frame.md            ← all verticals against plan
│   └── monkey-build.md            ← all verticals against merged diff
├── run-0002-auth-refresh/
└── ...
```

Runs are named `run-NNNN-feature-name`. The retro reads across runs to spot recurring patterns. All artifacts are markdown (except mockup.html) — readable by humans, agents, and GitHub alike.

## Design Principles

- **The Sentinel and The Shipwright are never the same agent.** Prevents correlated failure.
- **The finder never writes the fix.** Storm specs what's wrong, Sentinel writes the regression test, Shipwright patches. Three agents, three perspectives, no blind spots.
- **Paste SKILL.md verbatim.** Orchestrators never paraphrase, summarize, or select sections. The crew speaks for themselves.
- **Context goes in brief files.** `.insightsLoop/current/brief-<crew>.md` — inspectable, structured, discarded at archive time.
- **The Monkey is a real agent, not inline narrative.** Launched with a brief, receives context, returns structured markdown. Opus model.
- **Each agent at its strength.** Monkey = chaos (Frame + Build). Storm = adversarial review (TDD + Verify). Cartographer = mechanical enumeration (Ship).
- **Each Shipwright works in an isolated worktree.** Clean context per agent.
- **Storm and Cartographer run as parallel Agents.** Not sequential skills — true parallel execution at Ship.
- **The Sentinel never reads the Challenge section.** Independent failure mode derivation.
- **Values are pasted into agent briefs.** Not "read VALUES.md" — actually paste the content so subagents have it in context.
- **All artifacts are markdown.** Readable by humans, agents, and GitHub. No JSON. (Exception: `mockup.html` for visual previews.)
- **Runs are archived, not deleted.** History is how the loop improves.
- **Plan is a hard gate.** No plan = no build. Non-negotiable.
- **Each step produces an artifact consumed by the next.** Pipeline, not ceremony.
- **The Cartographer's empty report is valid.** No hallucinated findings.
- **The Monkey's `Survived: yes` is valid.** Resilience confirmed is signal, not silence.
- **Error handling is explicit.** Merge conflicts, test failures, and compile errors stop the loop and go to the human.
- **Every user gate uses `AskUserQuestion`.** Plain text is invisible. The tool is unmistakable.
- **Mockup path, not contents.** Subagents read `mockup.html` from disk — never pasted into briefs to avoid context bloat.
- **Precedence chain for UI:** VALUES.md > Visual Spec > mockup > existing codebase patterns.
- **The ship speaks themed, the crew speaks plain.** Orchestrator voice and artifact headers are themed. Findings, tables, briefs, and gates are always plain and parseable.

## Artifact Chain

```
plan.md → frame.md → test suite → storm-tdd.md → worktrees → storm-report.md + edge-cases.md
   ↑          ↑            ↑                           ↑              ↓
monkey-plan  greenfield  acceptance                  mockup    findings-consolidated.md
storm-plan   checklist   contracts                   (opt)            ↓
                                                            fix-specs.md → regression tests → patches
                                                                           ↓
                                                                    shippable diff
                                                                           ↑
                                                            monkey-frame / monkey-build
```

Active run in `.insightsLoop/current/`. Archived to `.insightsLoop/run-NNNN-feature-name/` on completion. Retro reads all of them.

## Install

```bash
# Install everything (10 skills, 3 themes, config)
npx insightsloop init

# Or pick specific skills
npx insightsloop init --skills=plan,monkey,storm

# Update skills later (preserves your config)
npx insightsloop update
```

This copies skills to `.claude/skills/`, themes to `.insightsLoop/themes/`, and creates `.insightsLoop/config.md` with defaults (theme: pirate, 3 monkey findings per vertical, confidence threshold 80).

Optionally add `VALUES.md` and `TDD-MATRIX.md` to your project root — every skill loads them before execution. Use [AssertValues](https://assertvalues.dev/) to generate sharp, constraining values through conversation.

## Themes

The entire devloop and plan experience is themed. Set it in `.insightsLoop/config.md`:

```markdown
## Theme
- setting: pirate
```

Available themes: `pirate` | `space` | `naval` | `none`

**What gets themed (the ship):** Orchestrator voice (mandatory at every step transition), step names, artifact headers, persona openers, vocabulary in orchestrator prose.

**What stays plain (the crew):** Findings tables, severity columns, confidence scores, file:line references, technique names, brief instructions, user gates. Always structured, always parseable.

| Theme | Ship | Vibe |
|-------|------|------|
| `pirate` | *The Insight* | Salt, timber, articles of agreement |
| `space` | *ISV Insight* | Vacuum, conduits, mission protocols |
| `naval` | *HMS Insight* | Discipline, welds, rules of engagement |
| `none` | — | Default, no roleplay |

Step names include the actual phase in brackets so you always know where you are: "Chart Course (Frame)", "Articles of Agreement (TDD)", etc.

Theme files live in `.insightsLoop/themes/` (or `themes/` in this repo). Copy them alongside the skill directories.

## Configuration

All tunables live in `.insightsLoop/config.md`:

```markdown
## Theme
- setting: none

## Monkey
- findings_per_step: 3

## Confidence (devloopfast only)
- threshold: 80
```

`findings_per_step` applies **per vertical**. With 5 verticals selected, the Monkey produces 15 findings (3 x 5).

## Monkey Confidence Calibration

The Monkey self-reports verification depth in every finding:

| Confidence | Meaning |
|------------|---------|
| **80-100** | Full code path traced — function, callers, callees. Confirmed no guard exists elsewhere |
| **50-79** | Immediate code read, looks wrong, but haven't traced all callers or searched for mitigations |
| **Below 50** | Pattern-based suspicion. Gut feeling, not evidence |

Every finding must state what was and wasn't verified. "I did NOT verify whether a guard exists upstream" with confidence 55 is more useful than a confident-sounding 90 that's wrong.

## Version History

### beta 0.10
- **Storm TDD Review**: Monkey at TDD replaced with Storm reviewing test contracts. Adversarial test gap analysis is Storm's lane, not chaos.
- **Single Build Monkey (all verticals)**: 5 parallel vertical Monkeys collapsed to 1 Monkey covering all relevant verticals in a single pass.
- **Frame Monkey expanded**: Covers all verticals against the plan — catches arch/data/security/integration/ops issues before code exists.
- **Cartographer as Agent**: Changed from Skill invocation to Agent for true parallel execution with Storm at Ship.
- **Theme immersion enforced**: Mandatory orchestrator voice at every step transition. Plan now theme-aware. Clear boundary: ship speaks themed, crew speaks plain.
- **`monkey_findings_per_step` default 3 per vertical**: 3 findings x 5 verticals = 15 findings per Monkey invocation.

### beta 0.8
- Brief construction (paste SKILL.md verbatim, brief files, present as-is)
- Greenfield detection (2-pass: existence + wiring)
- ATDD in Sentinel (acceptance tests first)
- Acceptance Criteria in Plan
- Monkey + Storm review plan in parallel
- 3-agent fix pipeline (Storm specs → Sentinel tests → Shipwright patches)
- Consolidated findings with `[concept]` vs `file:line` location contract
- Convergence gate, fix dispatch matrix, Monkey identity

### beta 0.4
- Monkey confidence calibration

### beta 0.3
- Themes (pirate, space, naval), persona seasoning, config system

### beta 0.2
- Visual mockup flow (/frontend-design integration)

## Documentation

- **[Architecture Diagram](docs/architecture.md)** — Mermaid diagrams of the pipeline, crew assignments, artifact flow, and chaos agent integration
- **[Credits & Acknowledgments](docs/CREDITS.md)** — Attribution for BMAD Method, frontend-design skill, and AssertValues
- **[Deferred Findings](FUTURE.md)** — Issues from the initial adversarial review, cut for beta

## Known Limitations

- The Monkey's quality depends on the Opus model. On weaker models, chaos degrades to noise.
- Confidence filtering at 80 is an initial threshold. Run `/retro` after builds to evaluate whether it's catching the right things.
- The loop hasn't been tested at scale beyond medium-sized features. Architectural changes with 5+ worktrees may hit context limits.
- `FUTURE.md` contains deferred findings from the initial adversarial review. These are real issues that weren't critical enough to block the beta.
- `/frontend-design` integration — the double invocation (Helmsman preview + Shipwright production) may produce visual drift between mockup and final output. Run `/insight-retro` to evaluate.
