# InsightsLoop (beta 0.2)

An opinionated dev engine for human+AI teams. 10 skills, 8 personas, one pipeline.

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

InsightsLoop doesn't ship with values — your project does. Create a `VALUES.md` at your repo root using [AssertValues](https://assertvalues.dev/) or by hand. Every skill loads it before execution. Every agent enforces it. The Monkey uses your values offensively — she catches the crew not following them.

Optionally add `TDD-MATRIX.md` to define when to test first vs. after — the Sentinel loads it as a gate.

No values file? The engine still works. It just can't push back on decisions that violate principles you haven't written down.

## The Crew

Every step has a persona. These aren't decoration — they define how each agent thinks and what it refuses to compromise on.

| Persona | Role | Skill | Model |
|---------|------|-------|-------|
| **The Navigator** | Charts every rock before setting sail | `/insight-plan` | Opus |
| **The Sentinel** | Writes contracts like lives depend on them | `/insight-sentinel` | Opus |
| **The Shipwright** | Builds fast, builds clean, no wasted wood | `/insight-shipwright` | Sonnet |
| **The Storm** | Finds the leak before the sea does + consistency enforcement | `/insight-storm` | Opus |
| **The Cartographer** | Maps every path, marks every cliff | `/insight-edge-case-hunter` | Sonnet |
| **The Monkey** | Cheerful, targeted chaos — if she doesn't break it, production will | `/insight-monkey` + every step | Opus |
| **The Helmsman** | Steers what the user sees — radical minimalist | `/insight-ux` | Opus |
| **The Lookout** | Remembers every voyage, spots the pattern | `/insight-retro` | Sonnet |

## The Loop

### Orchestrators

1. **`/insight-plan`** — The Navigator explores the codebase, asks hard questions, designs architecture, challenges against values. Produces `plan.md` (with Challenge section). Visual Spec section uses explicit MOVE/DELETE/ADD/KEEP instructions — every MOVE implies a DELETE at the source. For UI stories, asks whether to generate a visual HTML mockup (`--mockup` via `/frontend-design`) or keep it structural (ASCII wireframe).

2. **`/insight-devloop`** — The crew takes the charts and builds:
   - **Frame**: Triage (small/medium/architectural), parallelization plan
   - **Build**: The Sentinel writes tests (Opus) → The Shipwright builds (Sonnet, parallel worktrees)
   - **Ship**: Merge → The Storm + The Cartographer verify in parallel → fix
   - **The Monkey**: Launches as a real agent at every step. Structured markdown output. Specific chaos.
   - **Done**: Write summary, archive run (including `mockup.html` if exists), suggest `/insight-retro`
   - **Cartographer skip**: Visual-only changes (layout, CSS, copy) skip the Cartographer — Storm carries verification alone.
   - **User Gates**: Every decision point uses `AskUserQuestion` — frame approval, Monkey findings, merge conflicts, post-findings, pre-archive.

3. **`/insight-devloopfast`** — Speed mode. Same crew, same Monkey. Auto-triages small/medium (no approval gate), confidence-filters all findings at 80+ (Storm, Cartographer, and Monkey). Below-threshold findings saved to `filtered-findings.md`, never discarded. The Monkey still launches at every step — she just doesn't block. Same Cartographer skip for visual-only changes. User gates remain for architectural changes, merge conflicts, and pre-archive confirmation.

### Standalone Crew Skills

Each crew member can be invoked directly for focused work outside the loop:

4. **`/insight-sentinel`** — TDD contract writer. Derives failing test suites from plan intent. Tests behavior, not implementation. Boundary conditions are not optional.

5. **`/insight-shipwright`** — Implementation builder. Makes failing tests pass — fast, clean, no wasted wood. Follows Visual Spec as a hard instruction. Receives mockup as visual reference when available. Invokes `/frontend-design` for UI components, constrained by project values. 3 attempts max.

6. **`/insight-storm`** — Adversarial code reviewer + consistency enforcer. Traces inputs, outputs, irreversible decisions, and implicit assumptions. Separates introduced vs pre-existing issues. Handles cross-module naming and assumption consistency in a single pass.

7. **`/insight-monkey`** — The Monkey, standalone. Point her at a file, a plan, a diff, or a decision. She picks one technique from her arsenal, applies it with specificity, and produces a structured finding. Not a reviewer — a disruptor.

8. **`/insight-edge-case-hunter`** — The Cartographer maps every code path mechanically. Called at Ship, also standalone. Markdown table output. Empty report is valid.

9. **`/insight-ux`** — The Helmsman. Minimalist UX designer invoked when a story has a user-facing surface. Produces: user goal, flow (max 5 steps), layout (ASCII wireframe or HTML mockup via `--mockup`), cut list, and copy. With `--mockup`, reads existing pages for current design scheme and invokes `/frontend-design` constrained by project values. Mockup saved to `.insightsLoop/current/mockup.html` and passed to the Shipwright as visual contract. Subtract, don't add.

10. **`/insight-retro`** — The Lookout captures what the crew learned. Reads all artifacts including Monkey findings and filtered findings. Evaluates the confidence filter. Looks across multiple runs for patterns. Updates project knowledge.

## Visual Mockup Flow (new in beta 0.2)

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

The Monkey is what makes InsightsLoop different. She's not a checklist. She's not a second reviewer. She's a real Opus agent with eight chaos techniques:

1. **Assumption Flip** — reverse the strongest assumption, see if it holds
2. **Hostile Input** — creative inputs nobody considered (not just null)
3. **Existence Question** — should this thing exist at all?
4. **Scale Shift** — what happens at 10x, 100x, or zero?
5. **Time Travel** — what breaks tomorrow, next year, after a migration?
6. **Cross-Seam Probe** — where two modules meet, what differs?
7. **Requirement Inversion** — what if the user wants the opposite?
8. **Delete Probe** — what happens if you delete this entirely?

She picks the technique that would hurt most at each step. Her output includes a `Survived` field — because resilience confirmed is as valuable as weakness found. She's unpredictable by design. She never asks the same question twice.

## User Gates

Every decision point in the loop uses the `AskUserQuestion` tool — never plain text output. This makes it unmistakable when the engine needs you.

| Skill | Gate | When |
|-------|------|------|
| `/insight-plan` | Story selection | Phase 1 |
| `/insight-plan` | Mockup or ASCII | Phase 4 (UI stories) |
| `/insight-plan` | Architecture choice | Phase 4 |
| `/insight-plan` | Final plan approval | Phase 6 |
| `/insight-ux` | UX spec review | After 5 sections |
| `/insight-ux` | Mockup review | After `--mockup` HTML |
| `/insight-devloop` | Frame approval | Step 1 |
| `/insight-devloop` | Monkey challenges | Steps 2a, 2b (Survived: no) |
| `/insight-devloop` | Merge conflicts | Step 3a |
| `/insight-devloop` | Findings triage | Step 3b |
| `/insight-devloop` | Ship confirmation | Step 3d |
| `/insight-devloopfast` | Architectural frame only | Step 1 |
| `/insight-devloopfast` | Triage correction | Monkey says size is wrong |
| `/insight-devloopfast` | Merge conflicts, findings, ship | Steps 3a, 3b, 3d |

## Run History

Every build run is archived in `.insightsLoop/`:

```
.insightsLoop/
├── current/                  ← active run
├── run-0001-embed-widget/    ← archived
│   ├── summary.md
│   ├── plan.md
│   ├── mockup.html           ← if UI story used --mockup
│   ├── monkey-frame.md
│   ├── monkey-tdd.md
│   ├── monkey-build.md
│   ├── monkey-ship.md
│   └── storm-report.md
├── run-0002-auth-refresh/
└── ...
```

Runs are named `run-NNNN-feature-name`. The retro reads across runs to spot recurring patterns. All artifacts are markdown (except mockup.html) — readable by humans, agents, and GitHub alike.

## Design Principles

- **The Sentinel and The Shipwright are never the same agent.** Prevents correlated failure.
- **The Monkey is a real agent, not inline narrative.** Launched with a brief, receives context, returns structured markdown. Opus model.
- **Each Shipwright works in an isolated worktree.** Clean context per agent.
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

## Artifact Chain

```
plan.md → frame.md → test suite → worktrees → storm-report.md + edge-cases.md → shippable diff
                ↑                        ↑              ↑                    ↑
          monkey-frame.md      monkey-tdd.md   monkey-build.md     monkey-ship.md
                                     ↑
                              mockup.html (optional, from /insight-ux --mockup)
```

Active run in `.insightsLoop/current/`. Archived to `.insightsLoop/run-NNNN-feature-name/` on completion. Retro reads all of them.

## Install

Copy skill directories to `.claude/skills/` in your project. All 10 directories map 1:1 to skills:

```bash
# Clone and copy all skills
git clone https://github.com/sidtheone/insightsloop.git
cp -r insightsloop/{plan,devloop,devloopfast,sentinel,shipwright,storm,monkey,edge-case-hunter,ux,retro} your-project/.claude/skills/
```

Optionally add `VALUES.md` and `TDD-MATRIX.md` to your project root — every skill loads them before execution. Use [AssertValues](https://assertvalues.dev/) to generate sharp, constraining values through conversation.

## Known Limitations

- The Monkey's quality depends on the Opus model. On weaker models, chaos degrades to noise.
- Confidence filtering at 80 is an initial threshold. Run `/retro` after builds to evaluate whether it's catching the right things.
- The loop hasn't been tested at scale beyond medium-sized features. Architectural changes with 5+ worktrees may hit context limits.
- `FUTURE.md` contains deferred findings from the initial adversarial review. These are real issues that weren't critical enough to block the beta.
- `/frontend-design` integration is new in beta 0.2 — the double invocation (Helmsman preview + Shipwright production) may produce visual drift between mockup and final output. Run `/insight-retro` to evaluate.
