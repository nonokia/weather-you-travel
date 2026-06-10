# Agent Guardrails

Every autonomous workflow in this repository points Claude at this file. These
are the rules the agents operate under. They exist so that "the repo maintains
itself" never means "the repo can break or compromise itself unsupervised."

## The prime directive

**Humans approve; agents propose.** No agent merges its own work. Every change
an agent makes arrives as a pull request that must pass CI and receive human
review before it reaches `master`. Branch protection enforces this — the agents
have no path around it.

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
