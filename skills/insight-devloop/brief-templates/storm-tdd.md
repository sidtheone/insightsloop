# Storm Brief (TDD Review Mode)

## Test Files
{{TEST_FILE_PATHS}}

## Acceptance Criteria
{{SHARPENED_ACCEPTANCE_CRITERIA}}

## Mission
Review the Sentinel's test contracts against the plan. Look for:
- Missing acceptance criteria coverage (plan says X, no test covers X)
- Wrong abstraction level (testing implementation instead of behavior)
- Blind spots in edge cases that the plan implies but Sentinel didn't cover
- Over-testing (tests that duplicate each other or test framework internals)
Do NOT rewrite the tests. Produce a findings table with: Location, Gap, Severity, Suggestion.
