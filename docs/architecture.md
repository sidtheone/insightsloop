# InsightsLoop Architecture

## Pipeline Overview

The engine runs a three-phase pipeline: **Plan → Build → Reflect**. The Monkey (chaos agent) is present at every step.

```mermaid
flowchart TB
    subgraph plan["Phase 1: /insight-plan (Navigator, Opus)"]
        P0[Load VALUES.md + TDD-MATRIX.md]
        P1[Input Gate — PRD / spec / verbal]
        P2[Codebase Exploration — parallel agents]
        P3[Clarifying Questions]
        P4[Architecture Design]
        P4UI{UI Surface?}
        P5[Challenge — values fit + adversarial]
        P6["Write plan.md"]
        P0 --> P1 --> P2 --> P3 --> P4
        P4 --> P4UI
        P4UI -- yes --> UX["/insight-ux (Helmsman)\nmockup.html or ASCII"]
        P4UI -- no --> P5
        UX --> P5 --> P6
    end

    subgraph build["Phase 2: /insight-devloop (Crew, Opus orchestrator)"]
        direction TB
        F["Step 1: Frame\nTriage + parallelization plan"]
        TDD["Step 2a: TDD\nSentinel writes failing tests (Opus)"]
        B["Step 2b: Build\nShipwright in parallel worktrees (Sonnet)"]
        M["Step 3a: Merge\nConflict resolution"]
        V["Step 3b: Verify\nStorm + Cartographer in parallel"]
        FX["Step 3c: Fix\nApply findings"]
        VC["Step 3d: Verify Clean\nTests pass, typecheck passes"]
        D["Step 4: Done\nArchive run, suggest /insight-retro"]
        F --> TDD --> B --> M --> V --> FX --> VC --> D
    end

    subgraph retro["Phase 3: /insight-retro (Lookout, Sonnet)"]
        R1[Crew Round — 5 parallel agents reflect]
        R2[Synthesize learnings]
        R3[Update PATTERNS.md + project memory]
        R1 --> R2 --> R3
    end

    plan -->|plan.md| build
    build -->|artifacts| retro
```

## The Monkey — Chaos at Every Step

The Monkey is a real Opus agent launched at every step of the devloop, not inline narrative.

```mermaid
flowchart LR
    subgraph devloop["Devloop Steps"]
        F[Frame]
        T[TDD]
        B[Build]
        S[Ship]
    end

    M["The Monkey (Opus)\n8 chaos techniques\n3 findings per step"]

    F -.->|monkey-frame.md| M
    T -.->|monkey-tdd.md| M
    B -.->|monkey-build.md| M
    S -.->|monkey-ship.md| M
```

### 8 Chaos Techniques

| # | Technique | What it does |
|---|-----------|-------------|
| 1 | Assumption Flip | Reverse the strongest assumption |
| 2 | Hostile Input | Creative inputs nobody considered |
| 3 | Existence Question | Should this thing exist at all? |
| 4 | Scale Shift | What happens at 10x, 100x, or zero? |
| 5 | Time Travel | What breaks tomorrow or after migration? |
| 6 | Cross-Seam Probe | Where modules meet, what differs? |
| 7 | Requirement Inversion | What if the user wants the opposite? |
| 8 | Delete Probe | What if you delete this entirely? |

## Crew & Model Assignments

```mermaid
flowchart TB
    subgraph opus["Opus Models — Judgment & Creativity"]
        NAV["Navigator\n/insight-plan"]
        SEN["Sentinel\n/insight-sentinel"]
        STM["Storm\n/insight-storm"]
        MNK["Monkey\n/insight-monkey"]
        HLM["Helmsman\n/insight-ux"]
    end

    subgraph sonnet["Sonnet Models — Speed & Execution"]
        SHP["Shipwright\n/insight-shipwright"]
        CRT["Cartographer\n/insight-edge-case-hunter"]
        LKT["Lookout\n/insight-retro"]
    end

    NAV -->|plan.md| SEN
    SEN -->|test suite| SHP
    SHP -->|implementation| STM
    SHP -->|implementation| CRT
    HLM -->|mockup.html| SHP
    STM -->|storm-report.md| LKT
    CRT -->|edge-cases.md| LKT
```

**Why the split:** Opus handles judgment calls — planning, adversarial review, chaos testing, UX decisions. Sonnet handles mechanical execution — building from tests, path enumeration, record-keeping. The Sentinel and Shipwright are never the same agent (prevents correlated failure).

## Artifact Flow

```mermaid
flowchart LR
    V[VALUES.md] --> PLAN[plan.md]
    PLAN --> FRAME[frame.md]
    FRAME --> TESTS[test suite]
    TESTS --> WT["worktrees\n(parallel builds)"]
    WT --> MERGE[merged code]
    MERGE --> STORM[storm-report.md]
    MERGE --> EDGE[edge-cases.md]
    STORM --> DIFF[shippable diff]
    EDGE --> DIFF
    DIFF --> SUM[summary.md]

    MOCK[mockup.html] -.->|optional| WT

    MF[monkey-frame.md] -.-> FRAME
    MT[monkey-tdd.md] -.-> TESTS
    MB[monkey-build.md] -.-> WT
    MS[monkey-ship.md] -.-> DIFF
```

## Run Archiving

```
.insightsLoop/
├── config.md                    ← tunables (theme, monkey count, confidence)
├── themes/                      ← pirate.md, naval.md, space.md
├── current/                     ← active run artifacts
└── run-NNNN-feature-name/       ← archived completed runs
    ├── summary.md               ← kept
    ├── plan.md                  ← kept
    ├── mockup.html              ← kept (if exists)
    ├── monkey-*.md              ← kept (all 4)
    └── storm-report.md          ← kept
```

## Speed Mode (/insight-devloopfast)

Same crew, same Monkey. Two differences:

1. **Auto-triage** — small/medium changes skip the frame approval gate
2. **Confidence filter** — findings below 80 confidence go to `filtered-findings.md` instead of blocking

The Monkey still launches at every step. She just doesn't block on low-confidence findings.

## Themes

Themes change voice and vocabulary only — never file paths, technique names, severity levels, or logic.

| Theme | Ship Name | Setting |
|-------|-----------|---------|
| `pirate` | *The Insight* | Salt, timber, articles of agreement |
| `space` | *ISV Insight* | Vacuum, conduits, mission protocols |
| `naval` | *HMS Insight* | Discipline, welds, rules of engagement |
| `none` | — | Default, no roleplay |
