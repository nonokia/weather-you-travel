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
  AGENT_GUARDRAILS.md         # the rules every agent prompt references (the "constitution")
  scripts/
    pipeline-record-failure.sh # shared checkpoint-on-failure handler
  workflows/
    ci.yml                    # quality gate (no AI)
    security-scan.yml         # npm audit + gitleaks + dep review (no AI)
    auto-merge.yml            # risk-based PR triage (no AI)
    agent-resume.yml          # re-dispatches interrupted pipelines (no AI)
    claude.yml                # interactive @claude
    pr-review.yml             # read-only agent review on each PR
    self-healing-ci.yml       # CI failure  -> fix PR
    agent-build.yml           # labeled issue -> phased, resumable pipeline -> PR
    self-improvement.yml      # weekly cron -> improvement PR
    security-autofix.yml      # scan failure -> remediation PR
    incident-response.yml     # runtime error -> RCA + fix PR
docs/
  AUTONOMOUS_SYSTEM.md        # this file
  CASE_STUDIES/               # log of what agents actually shipped
```

Four workflows are plain automation (no model): the CI gate, the security
scan, the auto-merge triage, and the pipeline-resume sweeper. The agent
workflows all invoke `anthropics/claude-code-action@v1`, pass it a focused
`prompt`, and point it at `AGENT_GUARDRAILS.md`. Each runs with a `--max-turns`
budget and opens a PR on a namespaced branch (`auto-fix/`,
`agent-build/issue-<n>`, `security-fix/`, `incident-fix/`,
`self-improvement/`).

### Trigger model

| Mechanism | Used by | Notes |
|---|---|---|
| `issues` (labeled) | agent-build, incident-response | label-gated so arbitrary issues don't spend budget |
| `issue_comment` / review comment | claude | `@claude` mention |
| `workflow_run` (completed→failure) | self-healing-ci, security-autofix | reacts to the gate's own result |
| `schedule` (cron) | self-improvement, agent-resume | weekly improvement PR; 2-hourly pipeline resume sweep |
| `repository_dispatch` | incident-response | external error monitor → `incident` event |
| `workflow_dispatch` (self-chain) | agent-build | each implementation chunk dispatches the next as a fresh session |

---

## The build pipeline: checkpointed phases

`agent-build.yml` is not one long agent run; it is a **pipeline of small,
independent agent sessions** with a committed checkpoint between every step.
This exists because of a hard operational lesson: on a subscription plan, a
long autonomous session can die mid-way on the **session limit**, and a
monolithic run loses *everything* when that happens.

```
issue + agent:build
   │
   ▼
[propose]      one session writes an OpenSpec change:
   │           proposal.md + tasks.md (small, self-contained tasks)
   ▼
[constitution] a SEPARATE session reviews the spec against
   │           AGENT_GUARDRAILS.md + CLAUDE.md + the issue itself
   │           → REVIEW.md with `VERDICT: approved | rejected`
   │           (rejected → pipeline stops, findings commented on the issue)
   ▼
[implement]    each session completes AT MOST 3 tasks, committing and
   │  ⟲        pushing after every task, then the workflow dispatches the
   │           next chunk as a fresh session (workflow_dispatch self-chain)
   ▼
[PR]           when tasks.md is fully checked: verify lint/test/build,
               open the PR (closes the issue) → human review as usual
```

### The branch is the checkpoint

Each pipeline lives on `agent-build/issue-<n>`:

- **`.agent/pipeline.json`** — `{issue, change, phase, status, attempts, pr}`.
  Phase transitions are made by deterministic workflow steps (`jq`), never by
  the model, so the recorded state can't drift from reality.
- **`openspec/changes/<name>/tasks.md`** — the checked/unchecked boxes ARE the
  implementation progress.
- Agent sessions push after every task, so a dying session loses at most one
  small unit of work.

Why commit state to the branch instead of relying on run artifacts? Committed
state **survives anything**, is **reviewable** (the PR shows the full audit
trail: spec, review verdict, per-task commits), and resuming is just a
`git fetch` — no cross-run artifact lookup, no retention expiry. Each phase
*also* uploads the checkpoint as a run artifact, but purely for visibility on
the run page.

### Resume after an interruption

`agent-resume.yml` sweeps every two hours (no model, zero agent-credit cost):
any `agent-build/issue-*` branch whose checkpoint says `in_progress` — and
which does **not** already have an open PR — gets re-dispatched, and the
pipeline's `context` job re-derives the phase from the checkpoint and continues
**from where it stopped**. A session-limit outage therefore costs only time:
the pipeline picks itself back up once the limit resets.

When the final chunk opens the PR, the pipeline deliberately does **not** push
a "done" commit to the branch: that extra commit (pushed via `GITHUB_TOKEN`)
would become the PR head, and `GITHUB_TOKEN` pushes don't auto-run workflows,
so the required CI checks would sit in `action_required` and block the merge.
Leaving the PR head as the agent's own (GitHub-App-pushed) task commit lets CI
run automatically. The **open PR is the completion marker** — which is why the
resume sweep skips branches that already have one.

Failure accounting: every failed phase run commits `attempts.<phase>+1` to the
checkpoint. After 6 failures in one phase the pipeline marks itself `blocked`
and comments on the issue — at that point a human decides (a real bug in the
request needs the issue clarified; an exhausted monthly credit pool just needs
patience). **Re-adding the `agent:build` label resets the counters and
resumes**; for a `rejected` spec it restarts at propose, where the next
propose session is instructed to address every finding in `REVIEW.md`.

A per-issue `concurrency` group keeps duplicate dispatches (self-chain +
sweeper) from ever running in parallel; the checkpoint makes re-runs
idempotent, so a duplicate is just a cheap no-op.

### Why a separate constitution check?

The spec author and the spec reviewer are **different sessions with different
prompts** — the reviewer is told to distrust and verify, and it may only write
`REVIEW.md`. This catches scope creep, forbidden-path edits, and missing test
plans *before* any implementation budget is spent, and it produces a written
verdict on the issue that a human can audit. It is the same
"agents propose, a gate disposes" idea applied one level earlier: to the plan
instead of the code.

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

> ℹ️ **The agent needs its tools allow-listed.** `claude-code-action` denies
> tools by default, so each agent workflow passes
> `--allowedTools Bash,Edit,Read,Write,Glob,Grep` in `claude_args`. Without
> `Bash`, the agent can't run `npm` and burns its whole turn budget on denied
> tool calls (the failure looks like *"Reached maximum number of turns"* with a
> high `permission_denials_count`). Keep the allow-list if you copy these.

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

- the workflows use right-sized `--max-turns` budgets (10–30) — enough to
  finish the task in one run (a too-low cap still bills for the turns it spends
  but produces nothing, so it's false economy); the build pipeline goes
  further and splits work into several small sessions with committed
  checkpoints, so a session-limit interruption never wastes what was already
  done,
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
