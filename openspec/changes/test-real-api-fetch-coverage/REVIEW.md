VERDICT: approved

## Findings

**Scope (AGENT_GUARDRAILS.md § Scope of changes)**
- Spec touches only `src/services/api.test.js`, a test file — explicitly in the "Allowed to edit" list.
- No paths under `.github/` or `.agent/` are referenced anywhere in `proposal.md` or `tasks.md`.
- `proposal.md`'s Non-goals section explicitly rules out changes to `src/services/api.js`, `.github/`, `e2e/`, and other components — matches the issue's stated scope with no creep.

**Tests must never be weakened or deleted (AGENT_GUARDRAILS.md § Definition of done)**
- `tasks.md` explicitly instructs keeping the existing `afterEach` and the existing `aggregateForecast` test in the `real-API code path` describe block "as-is — do not delete or rewrite them," and adds new tests alongside rather than replacing anything.
- `proposal.md` Non-goals reiterates this. No existing mock-fallback or pure-helper test is touched.

**Correctness against actual implementation** (verified by reading current `src/services/api.js` and `src/services/api.test.js`):
- `API_KEYS.AVIATIONSTACK`/`API_KEYS.OPENWEATHER` are indeed read from `import.meta.env` once at module top level (lines 74-77) — the spec's `vi.resetModules()` + dynamic `await import('./api')` requirement is the correct fix, not speculative.
- Task 1's asserted fetch URL substring `flight_iata=JL123` and response shape `{ data: [raw] }` match `getFlightDetails`'s actual fetch call and its `data.data && data.data.length > 0` check (api.js:153-157).
- Task 2's asserted URL substring `q=Osaka` and response shape `{ list }` match `getWeather`'s actual fetch call and `if (data.list)` check (api.js:181-185).
- Task 3's "unexpected shape" cases (`{ error: 'rate limited' }`, missing `data`/`list`) correctly fall through the `if` without throwing, landing on the mock-fallback `return` below the try/catch — matches the real control flow, and the expected fallback values (`flightNumber: 'JL123'`, `arrival.city: 'Osaka'`, weather length 2) match the actual `FLIGHTS`/`WEATHER` mock tables.
- Reuse of `mapAviationStackFlight`/`aggregateForecast` (re-imported per-test from the fresh module) to build expected values avoids hand-duplicating the mapped shape and avoids stale-reference issues from the module reset.

**Architecture rules (CLAUDE.md)**
- Preserves the dual real+mock fetch path in `src/services/api.js` untouched — no production code changes proposed, consistent with "the app must keep working without keys."
- No UI-facing strings are added, so the i18n dual-locale-file rule doesn't apply here — correctly a non-goal.
- Test file stays next to source (`src/services/api.test.js`), matching the existing convention.

**Security posture**
- No real secrets used; stubbed env values are the literal string `'test-key'`. No new client-side key exposure introduced.

**tasks.md quality**
- Four small, ordered, self-contained tasks, each naming its file and giving a concrete `npx vitest run ... -t "..."` verification command.
- Task 4 is the closing full-suite gate (`npm run lint`, `npm run test:run`, `npm run build`), matching the constitution's Definition of Done.

No violations found. Approved as written.
