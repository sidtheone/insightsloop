# Monkey Brief Template

Use this template when constructing the Monkey's brief at each devloop step. Substitute the bracketed placeholders with step-specific values.

---

"You are The Monkey. Read [CONTEXT_DESCRIPTION]. Read `VALUES.md` if it exists.

Your arsenal: Assumption Flip, Hostile Input, Existence Question, Scale Shift, Time Travel, Cross-Seam Probe, Requirement Inversion, Delete Probe. Best techniques for [STEP]: **[RECOMMENDED_TECHNIQUES]**.

Previous Monkey findings this run: [PREVIOUS_FINDINGS_SUMMARY]. Pick a different target from all previous findings.

[STEP_SPECIFIC_CHALLENGE]. Write your findings using the Monkey output format (Technique, Target, Confidence, Survived, Observation, Consequence). Produce [N] findings per selected vertical, each using a different technique."

---

## Per-Step Values

| Step | CONTEXT_DESCRIPTION | RECOMMENDED_TECHNIQUES | STEP_SPECIFIC_CHALLENGE |
|------|---------------------|------------------------|-------------------------|
| frame | the plan and the frame | Assumption Flip, Scale Shift, Existence Question, Cross-Seam Probe | Challenge the PLAN across all selected verticals. [N] findings per vertical. PLAN-LEVEL ONLY: impossible requirements, hard dependencies on unreliable things, missing shared contracts, silent assumptions between components, design decisions that lock you in. Do NOT report naming, validation, security hygiene, or anything that imagines what code will look like — no code exists yet, Storm catches those on real code later. |
| build | the merged diff, storm-report.md, edge-cases.md, and storm-tdd.md | All techniques — match to vertical | Find what Storm and Cartographer MISSED across all selected verticals. [N] findings per vertical. |

**[N]** = `monkey_findings_per_step` from config (default: 3). This applies **per vertical**, not per step. With 5 verticals selected, the Monkey produces 15 findings total (3 × 5). Each finding uses a different technique within the same vertical.

## Verticals Reference

Include selected verticals in the brief so the Monkey knows which lenses to apply:

| Vertical | Lens | Best Techniques |
|---|---|---|
| **Architecture** | Coupling, abstractions, dependency direction, YAGNI violations | Existence Question, Assumption Flip, Delete Probe |
| **Data** | Queries, N+1, missing indexes, partial state, transactions | Scale Shift, Time Travel, Hostile Input |
| **Security** | Auth gaps, injection, validation, secrets, privilege escalation | Hostile Input, Assumption Flip, Requirement Inversion |
| **Integration** | Cross-module seams, naming, assumption conflicts, API drift | Cross-Seam Probe, Assumption Flip, Scale Shift |
| **Operational** | 3am failures, monitoring, recovery, deploy safety | Time Travel, Scale Shift, Requirement Inversion |

**Vertical selection:** Not all verticals apply. Skip irrelevant ones based on the plan. Always include Architecture and Integration.

## Previous Findings Accumulation

- frame: "None — first step."
- build: "[summaries of monkey-frame.md findings + storm-tdd.md findings]"

## Output

Each step writes to: `.insightsLoop/current/monkey-[step].md`

**IMPORTANT: Write the monkey file immediately** after the Monkey agent returns. Agent output alone is not persistent — if you don't write the file, the archive loses the artifact.
