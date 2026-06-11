#!/usr/bin/env bash
# Shared failure handler for the agent-build pipeline (.github/workflows/
# agent-build.yml). Runs when a phase job fails for ANY reason — an agent
# session dying on the Claude subscription's session limit looks the same to
# us as a real error, so we simply record the attempt on the checkpoint and
# let the resume sweeper retry later. After MAX_ATTEMPTS_PER_PHASE failures
# the pipeline is marked `blocked` and a human is pinged on the issue
# (re-adding the `agent:build` label resets the counters).
#
# Expects env: BRANCH, ISSUE, PHASE, MAX_ATTEMPTS_PER_PHASE, BOT_NAME,
# BOT_EMAIL, GH_TOKEN.
set -euo pipefail

# No pipeline branch yet (e.g. propose died before its first push): nothing
# to checkpoint — the next labeled/dispatched run starts fresh anyway.
if ! git fetch origin "+refs/heads/${BRANCH}:refs/remotes/origin/${BRANCH}" 2>/dev/null; then
  echo "No pipeline branch '${BRANCH}' to record the failure on — skipping."
  exit 0
fi

# Discard whatever half-finished state the failed session left in the
# workspace; the pushed branch is the only truth.
git checkout -f -B "$BRANCH" "origin/${BRANCH}"
git clean -fd

git config user.name "$BOT_NAME"
git config user.email "$BOT_EMAIL"

attempts="$(jq -r --arg p "$PHASE" '.attempts[$p] // 0' .agent/pipeline.json)"
attempts=$((attempts + 1))
tmp="$(mktemp)"

if [ "$attempts" -ge "$MAX_ATTEMPTS_PER_PHASE" ]; then
  jq --arg p "$PHASE" --argjson n "$attempts" \
    '.attempts[$p] = $n | .status = "blocked"' \
    .agent/pipeline.json > "$tmp" && mv "$tmp" .agent/pipeline.json
  git add .agent/pipeline.json
  git commit -m "pipeline: blocked after ${attempts} failed attempts at ${PHASE} (#${ISSUE})"
  git push origin "$BRANCH"
  gh issue comment "$ISSUE" --body "🛑 **agent-build pipeline blocked**: the \`${PHASE}\` phase failed ${attempts} times in a row, so automatic retries have stopped. Check the [workflow runs](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/workflows/agent-build.yml) for the cause (a usage-limit outage just needs a retry; a real error may need the issue clarified). Re-add the \`agent:build\` label to reset the counters and resume from the last checkpoint."
  echo "Pipeline for #${ISSUE} is now blocked (phase ${PHASE}, attempt ${attempts})."
else
  jq --arg p "$PHASE" --argjson n "$attempts" \
    '.attempts[$p] = $n' \
    .agent/pipeline.json > "$tmp" && mv "$tmp" .agent/pipeline.json
  git add .agent/pipeline.json
  git commit -m "pipeline: failed attempt ${attempts}/${MAX_ATTEMPTS_PER_PHASE} at ${PHASE} (#${ISSUE})"
  git push origin "$BRANCH"
  echo "Recorded failed attempt ${attempts}/${MAX_ATTEMPTS_PER_PHASE} at ${PHASE}; the resume sweeper will retry."
fi
