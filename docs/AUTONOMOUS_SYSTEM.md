# The Autonomous System — architecture & setup

This document explains how the self-operating layer of this repository works,
why it is structured the way it is, and exactly what must be configured on the
GitHub side for the agents to run.

---

## Design goals

1. **Intent in, working software out.** A human describes *what* they want; the
   system produces the code, tests, and PR.
2. **Never unsafe.** Autonomy is bounded by a deterministic gate and human merge
   approval. The interesting engineering is in the *constraints*, not the
   code-generation.
3. **Self-referential.** The system reacts to its own state — broken CI and
   failed security scans trigger remediation agents automatically.

---

## The foundation

Before any automation was added, the test suite was a single render assertion
and the linter was failing. **An auto-fix agent is only as trustworthy as the
signal that tells it whether a change is correct.** So the first step was to make
that signal real:

- Pure, network-free helpers were extracted from `src/services/api.js`
  (`getWeatherIcon`, `cityFromTimezone`, `mapAviationStackFlight`,
  `aggregateForecast`) and covered with unit tests.
- A genuine bug was fixed (the icon mapper returned the literal `"tj"` for
  unknown conditions).
- Vitest was scoped away from Playwright; ESLint was given Node globals for
  config/e2e files; the lint baseline was brought to zero errors.

This is the load-bearing idea of the whole demo: **tests-first is what makes
self-healing safe.** A green build is the contract every agent is held to.

---

## Components

```
.github/
  AGENT_GUARDRAILS.md         # the rules every agent prompt references
  workflows/
    ci.yml                    # quality gate (no AI)
    security-scan.yml         # CodeQL + npm audit + gitleaks + dep review (no AI)
    claude.yml                # interactive @claude
    self-healing-ci.yml       # CI failure  -> fix PR
    agent-build.yml           # labeled issue -> feature PR
    self-improvement.yml      # weekly cron -> improvement PR
    security-autofix.yml      # scan failure -> remediation PR
    incident-response.yml     # runtime error -> RCA + fix PR
docs/
  AUTONOMOUS_SYSTEM.md        # this file
  CASE_STUDIES/               # log of what agents actually shipped
```

The two `*-scan`/`ci` workflows are plain automation (no model). The five agent
workflows all invoke `anthropics/claude-code-action@v1`, pass it a focused
`prompt`, and point it at `AGENT_GUARDRAILS.md`. Each runs with a `--max-turns`
budget and opens a PR on a namespaced branch (`auto-fix/`, `agent-build/`,
`security-fix/`, `incident-fix/`, `self-improvement/`).

### Trigger model

| Mechanism | Used by | Notes |
|---|---|---|
| `issues` (labeled) | agent-build, incident-response | label-gated so arbitrary issues don't spend budget |
| `issue_comment` / review comment | claude | `@claude` mention |
| `workflow_run` (completed→failure) | self-healing-ci, security-autofix | reacts to the gate's own result |
| `schedule` (cron) | self-improvement | weekly, one PR |
| `repository_dispatch` | incident-response | external error monitor → `incident` event |

---

## Setup

### 1. Install the Claude GitHub App

Install <https://github.com/apps/claude> and grant it access to this repository.
This is what lets the action act as a GitHub identity (open PRs, comment).

### 2. Authentication — choose ONE

The `claude-code-action` needs credentials. There are two options:

| Option | Secret | Billing | Best for |
|---|---|---|---|
| **Subscription token** | `CLAUDE_CODE_OAUTH_TOKEN` | Your Claude Pro/Max plan's **agent-credit pool** | Capped, predictable cost; observing consumption before committing |
| **API key** | `ANTHROPIC_API_KEY` | Pay-as-you-go API credits | Uncapped throughput; long runs that must never be interrupted |

**The workflows ship configured for `CLAUDE_CODE_OAUTH_TOKEN`** (subscription).
Generate the token locally with `claude setup-token` (requires Pro/Max) and add
it under **Settings → Secrets and variables → Actions**.

> ⚠️ **Set only ONE secret.** If both `ANTHROPIC_API_KEY` and
> `CLAUDE_CODE_OAUTH_TOKEN` are present, **the API key takes precedence and you
> are billed at API rates** — which defeats the point of using the subscription.

> ℹ️ **`id-token: write` is required.** Every agent workflow's `permissions:`
> block includes `id-token: write` — the action mints its GitHub token via OIDC
> and fails with *"Could not fetch an OIDC token"* without it. This is already
> set in the shipped workflows; keep it if you copy them elsewhere.

#### How billing works after 2026-06-15

As of **June 15, 2026**, Anthropic splits subscription usage into two pools:

- **Interactive pool** (unchanged): claude.ai chat, and Claude Code used
  interactively in the terminal.
- **Agent-credit pool** (new): programmatic/autonomous usage — including
  **Claude Code GitHub Actions** — draws from a fixed monthly dollar credit,
  metered at full API rates, **no rollover**. Roughly **$20/mo on Pro**,
  ~$100 on Max 5x, ~$200 on Max 20x.

For this demo that's actually convenient: on Pro, the agent workflows spend from
a **capped ~$20/month** allowance, so you can watch real consumption without an
open-ended API bill. When the pool is exhausted, agent runs stop until it resets
(or until you add API billing). To stretch the pool further:

- the workflows use right-sized `--max-turns` budgets (15–30) — enough to
  finish the task in one run (a too-low cap still bills for the turns it spends
  but produces nothing, so it's false economy),
- prefer triggering one workflow at a time while you gauge cost,
- the two non-AI workflows (CI, security scan) cost nothing,
- you can pin a cheaper/faster model via `claude_args` (`--model <id>`).

To switch to **pay-as-you-go API billing** later, replace
`claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}` with
`anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}` in each agent workflow
(and remove the OAuth secret so it doesn't conflict).

### 3. Create the labels

The agents are label-gated. Create:

- `agent:build` — put on an issue to have it implemented
- `incident` — put on an issue to trigger root-cause analysis

### 4. Protect `master`

This is what makes "agents propose, humans dispose" real. Under
**Settings → Branches → Branch protection rules** for `master`:

- Require a pull request before merging (≥ 1 approval)
- Require status checks to pass: the **CI** checks (`Lint, test, build` and
  `End-to-end (Playwright)`)
- Do **not** allow the GitHub Actions bot / agents to bypass these rules

### 5. Allow Actions to create PRs

Under **Settings → Actions → General → Workflow permissions**:

- Enable **"Allow GitHub Actions to create and approve pull requests."**
- Read-and-write workflow permissions (or rely on the per-workflow `permissions`
  blocks already declared).

### 6. (Optional) Wire a runtime error monitor

To close the incident loop with real production errors, configure your error
monitor (e.g. Sentry) to call the GitHub API on a new issue:

```
POST https://api.github.com/repos/nonokia/weather-you-travel/dispatches
Authorization: Bearer <token with 'repo' scope>
Content-Type: application/json

{ "event_type": "incident", "client_payload": { "error": "<message>", "stack": "<trace>", "url": "<link>" } }
```

`incident-response.yml` stages `client_payload` and runs root-cause analysis.
Without a monitor, you can trigger the same flow by hand: open an issue with the
error details and add the `incident` label.

---

## Operating it day to day

- **Review every agent PR like a colleague's.** The point of the demo is *human
  judgment on top of agent throughput*, not blind trust.
- **Watch the budget.** If you're on the API key, each agent run costs tokens;
  the `--max-turns` caps bound the worst case. The two non-AI workflows (CI,
  security scan) are free of API cost.
- **When an agent gets stuck**, it is instructed to open a draft PR or comment
  describing the blocker rather than force a bad change. Treat that as a signal
  to step in.

---

## Known limitations

- The product app still ships API keys in the client bundle (by design, for the
  mock-friendly prototype). Productionizing that needs a backend proxy — see
  `BUSINESS_FEASIBILITY_REPORT.md` §1. It's left as a candidate task for the
  `agent-build` flow.
- Agents can only be as good as the gate. Coverage gaps in the test suite are
  blind spots; widening coverage is itself a recurring `self-improvement` target.
