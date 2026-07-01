# Agent Guardrails

Every autonomous workflow in this repository points Claude at this file. These
are the rules the agents operate under. They exist so that "the repo maintains
itself" never means "the repo can break or compromise itself unsupervised."

This document is also the **constitution** of the `agent-build` pipeline: its
constitution-check phase judges every proposed spec against these rules, and a
spec that violates them is rejected before any implementation starts.

## The prime directive

**Humans approve; agents propose** — with one bounded, audited exception (below).
Every change an agent makes arrives as a pull request that must pass CI before it
reaches `master`. Branch protection blocks direct pushes — agents have no path
around the gate.

## Merge policy (which PRs may auto-merge)

`auto-merge.yml` triages every PR into one of two lanes:

- **Low-risk → autonomous merge.** A PR authored by the agent (`claude[bot]`)
  whose changes are limited to **dependency metadata** (`package-lock.json`,
  `package.json`) or **`docs/`** is auto-merged once required checks pass. These
  are mechanical, well-verified changes (e.g. `security-autofix` dependency
  patches) where CI is a sufficient gate.
- **Everything else → human review.** Any PR that touches `src/`, `e2e/`,
  tests, or `.github/` (and every human-authored PR) is labelled
  `needs-human-review` and waits for a person to merge it. Code and workflow
  changes always get human eyes.

Add the **`hold`** label to any PR to suspend autonomous merging immediately.

## Scope of changes

- **Allowed to edit:** `src/`, `e2e/`, `docs/`, test files, and documentation.
- **Edit with care (call it out explicitly in the PR):** `*.config.js`,
  `package.json` dependencies.
- **Cannot be edited by this pipeline** — hard limits, not risk judgments.
  The constitution-check phase MUST reject on sight any spec whose
  `tasks.md`/`design.md` requires creating or editing a file under these
  paths, rather than approving it and letting it fail during implementation:
  - `.github/workflows/*` — the GitHub App token backing `claude[bot]` lacks
    the `workflows` OAuth scope, so GitHub unconditionally rejects any push
    that creates or modifies a workflow file, regardless of how small or
    correct the diff is. Confirmed empirically: issue #38 failed 6/6
    implement attempts with the identical `refusing to allow a GitHub App to
    create or update workflow ... without workflows permission` error before
    landing permanently in `blocked` (see orphaned branch
    `agent-build/issue-38`); it was ultimately fixed by a direct,
    non-pipeline push (PR #40).
  - `.github/` (everything else under it, including this file) and
    `.agent/` — not a token limit but a deliberate self-modification
    guardrail: every propose/implement/autofix agent session is explicitly
    instructed never to touch these paths, so that a pipeline run can never
    silently rewrite the constitution or pipeline state governing its own
    execution. Confirmed: issue #42 correctly self-blocked rather than
    improvising around this rule instead of editing this very file (see
    branch `agent-build/issue-42`).
  - Either category needs a human to make the change directly (or an
    explicit, deliberate exception carved out case by case) — re-running the
    pipeline against the same spec will not produce a different outcome.
- **Never touch:** `.env` real secrets, `package-lock.json` by hand (let
  `npm` regenerate it), anything under `.git/`.
- Keep diffs **minimal and focused** on the stated task. Do not opportunistically
  refactor unrelated code in a fix PR.

## Definition of done

A change is only complete when:

1. `npm run lint` passes.
2. `npm run test:run` passes (and new behavior has a new test).
3. `npm run build` succeeds.
4. The PR description explains *what changed and why*, in plain language.

If you cannot make the suite pass, **stop and open a PR (or comment) describing
where you are stuck** rather than weakening or deleting tests to force green.
Deleting or skipping a failing test to make CI pass is never an acceptable fix.

## Security posture

- Never commit credentials, tokens, or API keys. The app's design keeps real
  keys server-side (see `BUSINESS_FEASIBILITY_REPORT.md` §1) — do not introduce
  patterns that ship secrets to the client bundle.
- When remediating a vulnerability, prefer the smallest dependency bump or code
  change that resolves it. Note any breaking-change risk in the PR.
- Do not exfiltrate repository contents to third-party services.

## Cost discipline

- Respect the `--max-turns` budget set in each workflow.
- Prefer one well-scoped PR over many speculative ones.

## Honesty

Report what actually happened. If tests fail, say so. If a fix is partial, say
so. A truthful "I got halfway and here's the blocker" is more valuable than a
confident PR that doesn't work.
