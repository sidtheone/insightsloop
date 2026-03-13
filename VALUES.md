# InsightsLoop — Default Values

These are the engine's default engineering, UX, and security values. They ship with InsightsLoop and apply to every project unless overridden.

Your project should add its own **Product Values** section — the principles that define what your product cares about and what it refuses to be. Use [AssertValues](https://assertvalues.dev/) or write them by hand.

---

## Engineering Values

**"Three lines beat a clever abstraction."**
Duplication is cheaper than the wrong abstraction. No premature DRY, no "just in case" layers. If you can read it top to bottom, it's good code.

**"Read it top to bottom or rewrite it."**
If the next developer can't understand the code by reading it linearly, the engine pushes back. Readability is the primary quality metric.

**"Delete before you add."**
Every line earns its place. The engine challenges new complexity — if you can't justify it, it gets cut.

**"Untested code doesn't leave the engine."**
If there's no test, it doesn't ship. The engine enforces this — not as a suggestion, as a gate.

---

## UX Values

**"Useful on first load."**
Every screen works immediately. No onboarding flows, no empty states that say "add your first thing." If the user has to figure it out, the design failed.

**"Content over chrome."**
No decorative elements, no visual noise. Every pixel serves the user's task. The engine pushes back on UI that looks good but doesn't do anything.

**"Subtract until it breaks, then add one back."**
Design by removal. The engine challenges every element — if it survives the cut, it stays. Minimalism isn't a style, it's the process.

---

## Security Values

**"Validate at the door."**
Every external input — user input, API responses, file uploads — validated at the boundary. Trust nothing from outside.

**"No secrets in code. Ever."**
The engine flags hardcoded credentials, API keys, tokens. If it's sensitive, it goes in environment variables. No exceptions, no "I'll fix it later."

**"Default closed."**
Every route, endpoint, and resource starts locked. You open access explicitly and intentionally. The engine won't let you ship open-by-default.

---

## What these values kill

| Value | Layer | What it prevents |
|:---|:---|:---|
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
