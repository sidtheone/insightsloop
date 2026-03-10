# InsightsLoop

A lean development loop for human+AI collaboration. Seven skills, one crew.

```
/plan → /devloop (or /devloopfast) → /edge-case-hunter → /retro
```

## The Crew

Every step has a persona. These aren't decoration — they define how each agent thinks and what it refuses to compromise on.

| Persona | Role | Skill | Model |
|---------|------|-------|-------|
| **The Navigator** | Charts every rock before setting sail | `/plan` | Opus |
| **The Sentinel** | Writes contracts like lives depend on them | `/devloop` — TDD | Opus |
| **The Shipwright** | Builds fast, builds clean, no wasted wood | `/devloop` — Build | Sonnet |
| **The Editor** | One word, one meaning, no exceptions | `/devloop` — Normalize | Opus |
| **The Storm** | Finds the leak before the sea does | `/devloop` — Adversarial | Opus |
| **The Cartographer** | Maps every path, marks every cliff | `/edge-case-hunter` | Sonnet |
| **The Monkey** | Cheerful, targeted chaos — if she doesn't break it, production will | `/monkey` + every step | Opus |
| **The Helmsman** | Steers what the user sees — radical minimalist | `/ux` | Opus |
| **The Lookout** | Remembers every voyage, spots the pattern | `/retro` | Sonnet |

## The Loop

1. **`/plan`** — The Navigator explores the codebase, asks hard questions, designs architecture, challenges against values. Produces `plan.md` (with Challenge section).

2. **`/devloop`** — The crew takes the charts and builds:
   - **Frame**: Triage (small/medium/architectural), parallelization plan
   - **Build**: The Sentinel writes tests (Opus) → The Shipwright builds (Sonnet, parallel worktrees)
   - **Ship**: Merge → The Editor normalizes → The Storm + The Cartographer verify in parallel → fix
   - **The Monkey**: Launches as a real agent at every step. Structured markdown output. Specific chaos.
   - **Done**: Write summary, archive run, suggest `/retro`

3. **`/devloopfast`** — Speed mode. Same crew, same Monkey. Auto-triages small/medium (no approval gate), confidence-filters all findings at 80+ (Storm, Cartographer, and Monkey). Below-threshold findings saved to `filtered-findings.md`, never discarded. The Monkey still launches at every step — she just doesn't block.

4. **`/monkey`** — The Monkey, standalone. Point her at a file, a plan, a diff, or a decision. She picks one technique from her arsenal, applies it with specificity, and produces a structured finding. Not a reviewer — a disruptor.

5. **`/edge-case-hunter`** — The Cartographer maps every code path mechanically. Called at Ship, also standalone. Markdown table output.

6. **`/ux`** — The Helmsman. Minimalist UX designer invoked when a story has a user-facing surface. Produces: user goal, flow (max 5 steps), ASCII wireframe, cut list, and copy. Subtract, don't add.

7. **`/retro`** — The Lookout captures what the crew learned. Reads all artifacts including Monkey findings and filtered findings. Evaluates the confidence filter. Looks across multiple runs for patterns. Updates project knowledge.

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

## Run History

Every build run is archived in `.insightsLoop/`:

```
.insightsLoop/
├── current/                  ← active run
├── run-0001-embed-widget/    ← archived
│   ├── summary.md
│   ├── plan.md
│   ├── monkey-frame.md
│   ├── monkey-tdd.md
│   ├── monkey-build.md
│   ├── monkey-ship.md
│   └── storm-report.md
├── run-0002-auth-refresh/
└── ...
```

Runs are named `run-NNNN-feature-name`. The retro reads across runs to spot recurring patterns. All artifacts are markdown — readable by humans, agents, and GitHub alike.

## Design Principles

- **The Sentinel and The Shipwright are never the same agent.** Prevents correlated failure.
- **The Monkey is a real agent, not inline narrative.** Launched with a brief, receives context, returns structured markdown. Opus model.
- **Each Shipwright works in an isolated worktree.** Clean context per agent.
- **The Sentinel never reads the Challenge section.** Independent failure mode derivation.
- **Values are pasted into agent briefs.** Not "read VALUES.md" — actually paste the content so subagents have it in context.
- **All artifacts are markdown.** Readable by humans, agents, and GitHub. No JSON.
- **Runs are archived, not deleted.** History is how the loop improves.
- **Plan is a hard gate.** No plan = no build. Non-negotiable.
- **Each step produces an artifact consumed by the next.** Pipeline, not ceremony.
- **The Cartographer's empty report is valid.** No hallucinated findings.
- **The Monkey's `Survived: yes` is valid.** Resilience confirmed is signal, not silence.
- **Error handling is explicit.** Merge conflicts, test failures, and compile errors stop the loop and go to the human.

## Artifact Chain

```
plan.md → frame.md → test suite → worktrees → storm-report.md + edge-cases.md → shippable diff
                ↑                        ↑              ↑                    ↑
          monkey-frame.md      monkey-tdd.md   monkey-build.md     monkey-ship.md
```

Active run in `.insightsLoop/current/`. Archived to `.insightsLoop/run-NNNN-feature-name/` on completion. Retro reads all of them.

## Install

Copy skill directories to `.claude/skills/` or install as a plugin.

## Values

Every skill reads `VALUES.md` and `TDD-MATRIX.md` from the repo root before execution. Drop these files in any project and the crew adapts. The Monkey uses values offensively — she catches the crew not following them.

## Known Limitations

- The Monkey's quality depends on the Opus model. On weaker models, chaos degrades to noise.
- Confidence filtering at 80 is an initial threshold. Run `/retro` after builds to evaluate whether it's catching the right things.
- The loop hasn't been tested at scale beyond medium-sized features. Architectural changes with 5+ worktrees may hit context limits.
- `FUTURE.md` contains 35 deferred findings from the initial adversarial review. These are real issues that weren't critical enough to block the beta.
