# Add Real-API Fetch-Path Test Coverage for `src/services/api.js`

## What

Add direct test coverage for the **real-API branch** of `getFlightDetails` and
`getWeather` in `src/services/api.js` — the `await fetch(...)` calls at
`api.js:153` and `api.js:181`, guarded by `if (API_KEYS.AVIATIONSTACK)` /
`if (API_KEYS.OPENWEATHER)`. Today `src/services/api.test.js` only exercises
the pure helpers (`getWeatherIcon`, `cityFromTimezone`, `mapAviationStackFlight`,
`aggregateForecast`) and the mock-fallback branch (no key set). The branch that
actually calls `fetch`, parses the JSON response, and feeds it through the
mapping helpers has zero coverage.

Three new `it(...)` cases are added inside `src/services/api.test.js`,
extending the existing `describe('real-API code path', ...)` block:

1. `getFlightDetails` — stub a successful AviationStack-shaped `fetch`
   response with a key present; assert it returns exactly what
   `mapAviationStackFlight` would produce from that payload.
2. `getWeather` — stub a successful OpenWeatherMap-shaped `fetch` response
   with a key present; assert it returns exactly what `aggregateForecast`
   would produce from that payload.
3. `getFlightDetails` — stub `fetch` to reject with a key present; assert the
   function falls back to mock data instead of throwing (covers the existing
   `catch` block).

## Why

`AGENT_GUARDRAILS.md`'s definition of done requires new behavior to have a
test, and `docs/AUTONOMOUS_SYSTEM.md` frames the extracted pure helpers plus a
real unit suite as "the load-bearing idea of the whole demo." A code path with
zero coverage is exactly the blind spot that undermines that premise: if
`getFlightDetails`/`getWeather`'s real-API branch breaks (wrong URL param,
response-shape drift, an error silently swallowed), CI stays green and
nothing catches it until a human notices the app misbehaving with a real key
configured. This exact gap was flagged in issue #46 (closed stale, never
landed) and named again in a later audit; this is a fresh, small-scope
refiling of the same finding.

## Key implementation detail (read before writing tasks)

`API_KEYS` in `api.js` is a **module-level constant** evaluated once at
import time:

```js
const API_KEYS = {
  AVIATIONSTACK: import.meta.env.VITE_AVIATIONSTACK_KEY || '',
  OPENWEATHER: import.meta.env.VITE_OPENWEATHER_KEY || ''
};
```

`src/services/api.test.js` imports `getFlightDetails`/`getWeather` once at
the top of the file, before any test body runs. Calling `vi.stubEnv(...)`
inside an `it()` block changes `import.meta.env` at that point, but it does
**not** retroactively change the already-evaluated `API_KEYS` constant that
the top-of-file-imported `getFlightDetails`/`getWeather` closures capture. A
naive `vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'x'); await getFlightDetails(...)`
test would silently take the **mock-fallback branch**, not the real-API
branch — passing for the wrong reason and providing none of the coverage
this change exists to add.

The fix requires no production-code change: stub the env var, then
`vi.resetModules()` and dynamically `await import('./api')` to get a fresh
module instance that evaluates `API_KEYS` against the now-stubbed env. See
`design.md` for the exact pattern. This is a test-authoring detail, not a bug
in `api.js` — the module works correctly in the real app (env vars are fixed
for the life of a Vite build/dev-server process); it's only test isolation
across multiple `it()` blocks in one file that needs the reset-and-reimport
dance.

## Non-goals

- No changes to `src/services/api.js` (or any other `src/`/`e2e/` file) —
  test-only change. If, once writing the tests, the real-API branch proves
  genuinely untestable without a production change, keep that change minimal
  and call it out explicitly in the PR description — do not silently expand
  scope.
- No real network calls — everything is stubbed via `vi.stubGlobal('fetch', ...)`.
- No refactor of the dual-path (real API + mock fallback) structure in
  `api.js` — that pattern is intentional per `CLAUDE.md`.
- No E2E coverage, no changes to error-message copy, no retry/backoff logic.
- No i18n changes (no UI text is touched by this change).
