# InsightsLoop

A lean development loop for human+AI collaboration. Five skills, one crew.

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
| **The Monkey** | Cheerful destruction — if she doesn't break it, production will | Everywhere | — |
| **The Lookout** | Remembers every voyage, spots the pattern | `/retro` | Sonnet |

## The Loop

1. **`/plan`** — The Navigator explores the codebase, asks hard questions, designs architecture, challenges against values. Produces `plan.md` (with Challenge section).

2. **`/devloop`** — The crew takes the charts and builds:
   - **Frame**: Triage (small/medium/architectural), parallelization plan
   - **Build**: The Sentinel writes tests (Opus) → The Shipwright builds (Sonnet, parallel worktrees)
   - **Ship**: Merge → The Editor normalizes → The Storm + The Cartographer verify in parallel → fix
   - **Done**: Summary + suggest `/retro`

3. **`/devloopfast`** — Speed mode. Same crew, less ceremony. Auto-triages small/medium (no approval gate), confidence-filters findings (80+ only), skips Monkey and normalize for non-architectural changes. Filtered findings saved to `filtered-findings.json`, never discarded.

4. **`/edge-case-hunter`** — The Cartographer maps every code path mechanically. Called at Ship, also standalone. Structured JSON output.

5. **`/retro`** — The Lookout captures what the crew learned. Updates project knowledge so the next voyage is smarter.

## Design Principles

- **The Sentinel and The Shipwright are never the same agent.** Prevents correlated failure where the same misunderstanding produces wrong tests AND wrong code that agree.
- **Each Shipwright works in an isolated worktree.** Clean context per agent — quality mechanism, not speed optimization.
- **The Sentinel never reads the Challenge section.** She derives failure modes independently. Same blind spots = correlated failure.
- **Frame scales ceremony to change size.** Small changes skip most steps. Architectural changes run the full loop.
- **Plan is a hard gate.** No plan = no build. Non-negotiable.
- **Each step produces an artifact consumed by the next.** Pipeline, not ceremony.
- **The Cartographer's empty map is valid.** No hallucinated findings to justify existence.
- **The Monkey shows up uninvited at every step.** Without chaos, it's not engineering.

## Artifact Chain

```
plan.md → test suite → worktrees → storm-report.json + edge-cases.json → shippable diff
```

## Install

Copy skill directories to `.claude/skills/` or install as a plugin.

## Values

Built for teams that value YAGNI, simplicity, and "ship it and iterate." The process itself follows its own advice — minimal ceremony, maximum signal.
