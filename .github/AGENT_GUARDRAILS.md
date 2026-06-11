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
  `.github/workflows/`, `package.json` dependencies.
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
