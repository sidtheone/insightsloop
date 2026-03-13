# Future Considerations

Findings from the crew's adversarial review that were cut for a weekend project but may matter at scale.

## Navigator (6 deferred)
- Unclear agent handoff sequencing for parallel branches
- Missing rollback path for multi-phase epics
- No defined "done" signal between loop iterations
- Ambiguous scope boundaries between Planning and Execution agents
- Undocumented re-entry points after interruption
- ~~Missing escalation path when agents disagree~~ **Fixed (v0.5):** Monkey + Storm review plan in parallel (Change E), user gate resolves disagreements

## Sentinel (15 deferred)
- ~~Formal input validation contracts between agents~~ **Fixed (v0.5):** Brief file format contracts define exact handover schemas (Change A), consolidated findings location contract (Change G)
- Explicit error type taxonomies
- Versioned prompt contracts
- ~~Handoff schema enforcement between planner and executor~~ **Fixed (v0.5):** Plan produces Acceptance Criteria (Change D), Sentinel consumes via brief with explicit sections, scaffolding checklist has its own file
- ~~Output contract for the reviewer agent~~ **Fixed (v0.5):** Storm has explicit output contracts per mode — Verify, Plan Review, Fix Spec (Changes A/E/F)
- Retry contract specifications
- SLA definitions for agent response time
- Task granularity specification in plan.md
- Dependency annotation format enforcement
- Key Files shared ownership flagging
- Triage label source-of-truth protocol
- Dependency map dedup between plan.md and challenge.md
- ~~frame.md template specification~~ **Fixed (v0.5):** Greenfield gate outputs to scaffolding-checklist.md with defined format (Change B), frame.md role clarified
- Worktree scope assignment protocol
- Test suite file location convention

## Storm (7 deferred)
- Agent loop circuit breaker
- Context window overflow detection
- ~~Cascading failure prevention~~ **Fixed (v0.5):** Fix pipeline split into 3 agents (Storm specs → Sentinel tests → Shipwright patches) to break correlated failure (Change F)
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
