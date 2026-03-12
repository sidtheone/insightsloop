# Future Considerations

Findings from the crew's adversarial review that were cut for a weekend project but may matter at scale.

## Navigator (6 deferred)
- Unclear agent handoff sequencing for parallel branches
- Missing rollback path for multi-phase epics
- No defined "done" signal between loop iterations
- Ambiguous scope boundaries between Planning and Execution agents
- Undocumented re-entry points after interruption
- Missing escalation path when agents disagree

## Sentinel (15 deferred)
- Formal input validation contracts between agents
- Explicit error type taxonomies
- Versioned prompt contracts
- Handoff schema enforcement between planner and executor
- Output contract for the reviewer agent
- Retry contract specifications
- SLA definitions for agent response time
- Task granularity specification in plan.md
- Dependency annotation format enforcement
- Key Files shared ownership flagging
- Triage label source-of-truth protocol
- Dependency map dedup between plan.md and challenge.md
- frame.md template specification
- Worktree scope assignment protocol
- Test suite file location convention

## Storm (7 deferred)
- Agent loop circuit breaker
- Context window overflow detection
- Cascading failure prevention
- Race condition between parallel agents
- Silent garbage output detection
- State corruption across iterations
- Irreversible action confirmation gate

## Shipwright (7 deferred)
- Reporting infrastructure
- Metrics pipeline
- Multi-user permission model
- Audit log schema
- Agent performance dashboard
- Formal retrospective artifact format
- Integration test harness for agent contracts

## Storm — Consistency (4 deferred, formerly Editor)
- "Loop" vs "Cycle" consistency
- "Agent" vs "Assistant" consistency
- "Human-in-the-loop" vs "Human-on-the-loop" consistency
- Role name capitalization consistency
