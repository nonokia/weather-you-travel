# Add Real-API Fetch-Path Test Coverage for `src/services/api.js`

## What

Extend `src/services/api.test.js`'s `real-API code path` describe block so it
actually exercises the `fetch`-based branches of `getFlightDetails` and
`getWeather` — the code paths that run when `VITE_AVIATIONSTACK_KEY` /
`VITE_OPENWEATHER_KEY` are set. Today that describe block only calls the pure
`aggregateForecast` helper directly; its `afterEach` (`vi.unstubAllGlobals()` /
`vi.unstubAllEnvs()`) is leftover scaffolding for stubs that are never set up.

This is a **test-only** change. No production code in `src/services/api.js`
changes.

## Why

Nothing in the current suite exercises the actual `fetch` → `response.json()`
→ transform → return flow inside `getFlightDetails`/`getWeather`, nor the
try/catch fallback-to-mock behavior when that fetch throws or the API
response has an unexpected shape. A regression in URL construction, response
parsing, or the fallback trigger would pass CI undetected. This gap has been
flagged in three consecutive system audits (#37, #39/#41 finding 4, and the
most recent cycle's report) without being addressed — see issue #46.

`API_KEYS.AVIATIONSTACK` / `API_KEYS.OPENWEATHER` in `src/services/api.js` are
read from `import.meta.env` once, at module top level, not inside the
exported functions. That means tests must stub the env *before* the module is
evaluated — via `vi.resetModules()` plus a dynamic `await import('./api')` —
to get a module instance whose `API_KEYS` actually reflects the stub.

## Non-goals

- No changes to `src/services/api.js` (implementation is already correct;
  this closes a coverage gap, not a bug).
- No changes to `.github/`, `e2e/`, other components, or any UI/i18n strings
  (this change adds no user-facing text).
- Does not weaken, delete, or replace any existing mock-fallback or
  pure-helper test.
