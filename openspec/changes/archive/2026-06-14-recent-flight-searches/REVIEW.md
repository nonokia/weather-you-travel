VERDICT: approved

## Constitution Check — Recent Flight Searches (Issue #24)

Reviewed against: `.github/AGENT_GUARDRAILS.md`, `CLAUDE.md`, and the issue acceptance criteria.

---

### AGENT_GUARDRAILS.md

| Rule | Finding |
|---|---|
| Scope of changes | `src/` only. Explicitly excludes `.github/`, `e2e/`, `package.json`, and `src/services/api.js`. ✓ |
| Tests not weakened | Task 2 adds new tests; Task 6 explicitly forbids deleting/skipping tests. ✓ |
| Security posture | No secrets, no API keys, no exfiltration. `localStorage` usage is client-side state only, consistent with existing app patterns. ✓ |
| Minimal focused diff | No opportunistic refactoring; scope is tightly bounded to the feature. ✓ |
| Definition of done | Task 6 runs `npm run lint`, `npm run test:run`, `npm run build` in order and requires all three to exit 0. ✓ |

---

### CLAUDE.md Architecture Rules

| Rule | Finding |
|---|---|
| Data fetching via `src/services/api.js` only | Not applicable — feature reads/writes `localStorage`, no network calls. `src/services/api.js` is explicitly excluded from scope. ✓ |
| i18n keys in **both** locale files | Task 3 adds `recentSearches` to both `src/locales/en/translation.json` and `src/locales/ja/translation.json`. Design table shows both translations. ✓ |
| Tests next to source | `src/utils/searchHistory.test.js` sits beside `src/utils/searchHistory.js`. ✓ |
| State in `src/App.jsx` | `recentSearches` state and `handleRecentSelect` handler live in `App.jsx`. ✓ |
| Presentational components receive data via props | `RecentSearches.jsx` takes `searches` and `onSelect` props; no direct state access. ✓ |

---

### Issue #24 Acceptance Criteria

| Criterion | Addressed by |
|---|---|
| `addRecentSearch`: prepend, case-insensitive dedup (normalized uppercase, trimmed), cap 5, persist | Task 1 + design contract table ✓ |
| `getRecentSearches`: most-recent-first, `[]` on missing/corrupt data, never throws | Task 1 + design contract table ✓ |
| Storage key `wyt:recentSearches` | Specified in both design and tasks ✓ |
| Presentational component renders chips below flight input, renders `null` when empty | Task 4 + design wiring section ✓ |
| Chip click sets departure field and runs search | Task 5 `handleRecentSelect` wiring ✓ |
| History updated only on successful departure-flight lookup | Task 5 step 4: call after `setDepartureData(depFlight)` succeeds ✓ |
| All user-facing text via `t()` | Task 4 uses `useTranslation`; Task 3 adds keys ✓ |
| Unit tests: ordering, case-insensitive dedup, 5-item cap, empty/corrupt localStorage | Task 2 enumerates all 6 cases explicitly ✓ |
| `localStorage` access guarded in try/catch | Specified in both design and Task 1 ✓ |
| No changes to `src/services/api.js`, `.github/`, `e2e/`, `package.json` | Stated as non-goals in proposal and task list ✓ |

---

### Tasks Quality

Tasks are small, ordered, and self-contained. Each task names its target file(s) and includes a concrete verification command. Task 6 is the required full lint/test/build gate. No issues.

---

### Notes (non-blocking)

- The `handleRecentSelect` handler passes `''` as the return-flight argument to `handleSearch`. This clears any in-progress return-flight value when a chip is clicked, which is the correct behaviour for "departure only" history. The implementer should ensure the `FlightInput` controlled inputs also visually reflect the state change (i.e., `depFlightNum` and `retFlightNum` props are updated from `App.jsx` state). This is an implementation-level concern fully within the implementer's responsibility and does not require a spec change.

No constitutional violations found. The spec is correct, complete, and safe to implement.
