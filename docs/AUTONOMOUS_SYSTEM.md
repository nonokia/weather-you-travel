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

The `claude-code-action` needs credentials. There are two options, and **the
right choice depends on your Claude plan** (see the caveat below):

| Option | Secret | Billing | Best for |
|---|---|---|---|
| **API key** | `ANTHROPIC_API_KEY` | Pay-as-you-go API credits | Reliable automation; long agentic runs that must not be interrupted |
| **Subscription token** | `CLAUDE_CODE_OAUTH_TOKEN` | Your Claude Pro/Max plan | Hobby use; short tasks; avoiding separate API billing |

> ⚠️ **Pro-plan caveat.** If you authenticate with a **Claude Pro** subscription
> token, long autonomous runs can hit your plan's usage limit and **stop
> mid-task**, leaving a half-finished PR. The agent workflows here use multi-turn
> budgets (`--max-turns` 18–25) precisely because real fixes take several turns.
> For dependable operation, prefer the **API key** (pay-as-you-go) — it bills per
> token and won't be cut off by a subscription cap. If you stay on Pro:
> - expect that bigger tasks (agent-build, incident-response) may be truncated,
> - lower the `--max-turns` values in the workflows to fit a smaller budget,
> - and/or pin a cheaper model in `claude_args` (e.g. `--model <fast-model-id>`).
>
> The workflows ship configured for `ANTHROPIC_API_KEY`. To use a subscription
> token instead, replace `anthropic_api_key:` with
> `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}` in each
> agent workflow. Generate the token locally with `claude setup-token`
> (requires a Pro/Max plan).

Add the chosen secret under **Settings → Secrets and variables → Actions**.

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
