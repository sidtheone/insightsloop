# InsightsLoop — Values

An opinionated engine for shipping quality, minimalist software with less drift.

---

## Product Values

**"One pipeline. No options."**
You don't configure InsightsLoop. You run it. The engine decides which personas show up, what gets checked, when chaos hits. Opinionated means you trust the process or you use something else.

**"Friction is the feature."**
Gates, chaos, reviews — they slow you down on purpose. If everything is going well, nothing is going well. The engine catches drift before you ship it, not after.

**"Ship less, ship right."**
MVP means the minimum that's actually good — not the minimum you can get away with. When speed and quality conflict, speed loses. Every time.

**"Weekend scale."**
Built for solo builders and small crews shipping on nights and weekends. No enterprise workflows, no team dashboards, no org charts. If it doesn't fit in a weekend session, it doesn't fit.

---

## Engineering Values

**"Three lines beat a clever abstraction."**
Duplication is cheaper than the wrong abstraction. No premature DRY, no "just in case" layers. If you can read it top to bottom, it's good code.
*Serves: "Ship less, ship right."*

**"Read it top to bottom or rewrite it."**
If the next developer can't understand the code by reading it linearly, the engine pushes back. Readability is the primary quality metric.
*Serves: "Friction is the feature."*

**"Delete before you add."**
Every line earns its place. The engine challenges new complexity — if you can't justify it against the product values, it gets cut.
*Serves: "One pipeline. No options."*

**"Untested code doesn't leave the engine."**
If there's no test, it doesn't ship. The engine enforces this — not as a suggestion, as a gate.
*Serves: "Friction is the feature."*

---

## UX Values

**"Useful on first load."**
Every screen the engine helps you build works immediately. No onboarding flows, no empty states that say "add your first thing." If the user has to figure it out, the design failed.
*Serves: "Weekend scale."*

**"Content over chrome."**
No decorative elements, no visual noise. Every pixel serves the user's task. The engine pushes back on UI that looks good but doesn't do anything.
*Serves: "Ship less, ship right."*

**"Subtract until it breaks, then add one back."**
Design by removal. The engine challenges every element — if it survives the cut, it stays. Minimalism isn't a style, it's the process.
*Serves: "Ship less, ship right."*

---

## Security Values

**"Validate at the door."**
Every project the engine builds validates all external input — user input, API responses, file uploads — at the boundary. Trust nothing from outside.
*Serves: "Ship less, ship right."*

**"No secrets in code. Ever."**
The engine flags hardcoded credentials, API keys, tokens. If it's sensitive, it goes in environment variables. No exceptions, no "I'll fix it later."
*Serves: "Friction is the feature."*

**"Default closed."**
Every route, endpoint, and resource starts locked. You open access explicitly and intentionally. The engine won't let you ship open-by-default.
*Serves: "One pipeline. No options."*

---

## What these values kill

| Value | Layer | What it prevents |
|:---|:---|:---|
| "One pipeline. No options." | Product | Plugin systems, config files, "choose your workflow" |
| "Friction is the feature." | Product | Skipping reviews, disabling chaos, "fast mode" that bypasses gates |
| "Ship less, ship right." | Product | Feature creep, "nice to have" scope, shipping without tests |
| "Weekend scale." | Product | Enterprise features, team management, org-level anything |
| "Three lines beat a clever abstraction." | Engineering | Utility libraries, base classes, "framework-ifying" simple code |
| "Read it top to bottom or rewrite it." | Engineering | Clever one-liners, deeply nested logic, magic |
| "Delete before you add." | Engineering | Dead code, unused imports, "might need this later" |
| "Untested code doesn't leave the engine." | Engineering | Shipping without coverage, "I'll add tests later" |
| "Useful on first load." | UX | Onboarding wizards, empty states, tutorial overlays |
| "Content over chrome." | UX | Decorative gradients, animations that don't inform, visual bloat |
| "Subtract until it breaks, then add one back." | UX | Feature-packed screens, "while we're at it" UI additions |
| "Validate at the door." | Security | Trusting client-side validation, unvalidated API responses |
| "No secrets in code. Ever." | Security | Hardcoded keys, committed .env files, "temporary" credentials |
| "Default closed." | Security | Open endpoints, permissive CORS, public-by-default resources |
