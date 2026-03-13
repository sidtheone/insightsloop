# Monkey Brief Template

Use this template when constructing the Monkey's brief at each devloop step. Substitute the bracketed placeholders with step-specific values.

---

"You are The Monkey. Read [CONTEXT_DESCRIPTION]. Read `VALUES.md` if it exists.

Your arsenal: Assumption Flip, Hostile Input, Existence Question, Scale Shift, Time Travel, Cross-Seam Probe, Requirement Inversion, Delete Probe. Best techniques for [STEP]: **[RECOMMENDED_TECHNIQUES]**.

Previous Monkey findings this run: [PREVIOUS_FINDINGS_SUMMARY]. Pick a different target from all previous findings.

[STEP_SPECIFIC_CHALLENGE]. Pick one technique and apply it with specificity — name the file, function, line, scenario. Write your finding using the Monkey output format (Technique, Target, Confidence, Survived, Observation, Consequence)."

---

## Per-Step Values

| Step | CONTEXT_DESCRIPTION | RECOMMENDED_TECHNIQUES | STEP_SPECIFIC_CHALLENGE |
|------|---------------------|------------------------|-------------------------|
| frame | the plan and the frame | Assumption Flip, Scale Shift, Existence Question | Challenge the triage decision or scope boundaries |
| tdd | the test suite the Sentinel just wrote and the plan | Hostile Input, Requirement Inversion, Delete Probe | Find the test suite's blind spot |

**Build step uses vertical briefs instead of this template.** See devloop SKILL.md Step 3b "Build Monkeys (parallel verticals)" for the vertical-specific brief format. Each vertical Monkey gets: merged diff + storm-report + edge-cases + its own lens and recommended techniques.

## Previous Findings Accumulation

- frame: "None — first step."
- tdd: "[1-line summary of monkey-frame.md finding]"
- build verticals: "[1-line summary of monkey-frame.md and monkey-tdd.md findings]" (shared across all verticals)

## Output

Each step writes to: `.insightsLoop/current/monkey-[step].md`

**IMPORTANT: Write the monkey file immediately** after the Monkey agent returns. Agent output alone is not persistent — if you don't write the file, the next Monkey loses dedup context and the archive loses the artifact.
