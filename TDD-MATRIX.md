# TDD Decision Matrix

When to write tests first vs. after. The engine enforces this — not as guidance, as a gate.

## TDD = Yes (test first)

| Signal | Why |
|--------|-----|
| New behavior that doesn't exist yet | Tests define the contract before you build it |
| Interface or contract change | Consumers break — tests catch the blast radius upfront |
| Ambiguous requirements | Writing the test forces clarity on what "done" means |
| Edge cases matter (security, money, data loss) | You won't remember to test them after |
| Bug fix | Write the failing test that reproduces the bug, then fix |

## TDD = No (test after or update existing)

| Signal | Why |
|--------|-----|
| Pure internal refactor, same external contract | Existing tests already define the contract |
| Swapping implementation, same API | Tests shouldn't care about internals |
| Deleting code | Less code = less to test |
| Spike or prototype (throwaway) | You don't know the contract yet |

## Grey zone — use judgment

| Signal | Lean toward |
|--------|-------------|
| "Obvious" pattern but touching multiple callers | TDD — "obvious" is an assumption |
| Performance optimization | Test after — measure first, then lock in the benchmark |
| Config or environment change | Test after — verify the new setup works, then lock it in |
| Third-party integration | Test after — get it working, then write contract tests at the boundary |
