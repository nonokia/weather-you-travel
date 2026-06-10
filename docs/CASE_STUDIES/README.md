# Case Studies — what the agents actually shipped

This is the living evidence log for the autonomous system. Each time an agent
ships something noteworthy — a self-healed CI failure, an agent-built feature, a
security remediation, an incident fix — it gets a short entry here so a reviewer
(or a portfolio visitor) can see the system working on real changes, not just in
theory.

Keep entries honest: record what the agent got right **and** what needed human
correction. A demo that only shows the happy path isn't a credible one.

## Entry format

Copy this template into a new dated file (`YYYY-MM-DD-short-slug.md`) or append
below:

```markdown
### YYYY-MM-DD — <title>

- **Workflow:** self-healing-ci | agent-build | security-autofix | incident-response | self-improvement
- **Trigger:** <what kicked it off — failing run link / issue # / advisory>
- **PR:** #<n>
- **What the agent did:** <1–3 sentences>
- **Outcome:** merged as-is | merged after human edits | closed
- **Human correction needed:** <none, or what>
- **Takeaway:** <what this shows about the system>
```

---

## Log

_No entries yet — the system was just set up. The first self-healed CI failure or
agent-built feature will be recorded here._
