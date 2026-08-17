# Tasks: Real-API Fetch-Path Test Coverage

- [ ] **Task 1 — Read the design note before writing anything**

  File: `openspec/changes/test-real-api-fetch-path/design.md` (read-only)

  `API_KEYS` in `src/services/api.js` is computed once at module import
  time, so `vi.stubEnv` alone (without `vi.resetModules()` + a dynamic
  `import('./api')`) will NOT route calls through the real-API branch — it
  will silently fall through to the mock-fallback branch instead, and the
  resulting tests would pass without covering the intended code. Read
  `design.md` in this same change directory for the exact pattern to use
  before writing Tasks 2–4. This task has no file changes; it exists so the
  pattern isn't skipped.

- [ ] **Task 2 — Test: `getFlightDetails` real-API success path**

  File: `src/services/api.test.js`

  Inside the existing `describe('real-API code path', ...)` block (around
  line 134), add a new `it(...)`:
  - Build a realistic AviationStack `data.data[0]` record (same shape as
    the `raw` fixture already used in the `describe('mapAviationStackFlight',
    ...)` block above it — reuse that shape, a fresh literal is fine, no
    need to extract a shared fixture).
  - `vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key')`.
  - `vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({ data: [raw] }) }))`.
  - `vi.resetModules()`, then `const { getFlightDetails, mapAviationStackFlight } = await import('./api')`.
  - Call `await getFlightDetails('JL123')` and assert the result
    `toEqual(mapAviationStackFlight(raw))`.
  - Also assert `fetch` was called once and the URL contains
    `flight_iata=JL123` (confirms the branch is wired to the right
    endpoint/param, not just any fetch call).
  - See `design.md` for the exact code pattern.

  Verify: `npx vitest run src/services/api.test.js` — new test passes.

- [ ] **Task 3 — Test: `getWeather` real-API success path**

  File: `src/services/api.test.js`

  In the same `describe('real-API code path', ...)` block, add a new
  `it(...)`:
  - Build an OpenWeatherMap-shaped payload: `{ list: [ { dt_txt: '2026-07-01 12:00:00', main: { temp: 27.6 }, weather: [{ main: 'Clear' }] }, /* add enough entries — at least 8 per day requested — to exercise aggregateForecast's 8-item stride */ ] }`.
    Reuse the same 24-entry generation pattern already used in the
    `describe('aggregateForecast', ...)` block above (`Array.from({ length: 24 }, ...)`)
    so the fixture spans 3 days.
  - `vi.stubEnv('VITE_OPENWEATHER_KEY', 'test-key')`.
  - `vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({ list }) }))`.
  - `vi.resetModules()`, then `const { getWeather, aggregateForecast } = await import('./api')`.
  - Call `await getWeather('Osaka', 3)` and assert the result
    `toEqual(aggregateForecast(list, 3))`.
  - Also assert `fetch` was called once and the URL contains `q=Osaka`.

  Verify: `npx vitest run src/services/api.test.js` — new test passes.

- [ ] **Task 4 — Test: fallback to mock data when the real API call rejects**

  File: `src/services/api.test.js`

  In the same `describe('real-API code path', ...)` block, add a new
  `it(...)` covering the existing `catch` block in `getFlightDetails`:
  - `vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key')`.
  - `vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))`.
  - `vi.resetModules()`, then `const { getFlightDetails } = await import('./api')`.
  - Call `await getFlightDetails('JL123')` (note: `JL123` is also a known
    mock flight number in `api.js`'s `FLIGHTS` table, so the mock-fallback
    branch resolves rather than rejects).
  - Assert the call resolves (does not throw) and returns the known mock
    fixture: `flightNumber: 'JL123'`, `arrival.city: 'Osaka'` — matching the
    assertions already used in `describe('getFlightDetails (mock fallback)',
    ...)`.
  - This proves a rejected `fetch` is caught and the function falls back to
    mock data instead of propagating the error, even with a key present.

  Verify: `npx vitest run src/services/api.test.js` — new test passes.

- [ ] **Task 5 — Reset modules between tests so existing tests stay isolated**

  File: `src/services/api.test.js`

  In the `describe('real-API code path', ...)` block's existing
  `afterEach`, add `vi.resetModules()` alongside `vi.unstubAllGlobals()` and
  `vi.unstubAllEnvs()`, so the dynamic-import module instances created in
  Tasks 2–4 don't leak into later tests (in this file or others) that rely
  on the static top-of-file import and an unset API key.

  Verify: `npx vitest run src/services/api.test.js` — full file passes, run
  it at least twice in a row locally (`npx vitest run src/services/api.test.js
  && npx vitest run src/services/api.test.js`) to confirm no ordering/leak
  flakiness.

- [ ] **Task 6 — Final validation: lint, full test suite, build**

  Run in sequence and fix any fallout from the changes above (do not skip,
  weaken, or delete any test — existing or new — to force green):
  ```bash
  npm run lint
  npm run test:run
  npm run build
  ```
  All three must exit with code 0. Confirm via `git diff --stat` that only
  `src/services/api.test.js` changed (or, if a minimal `src/services/api.js`
  change proved unavoidable, that it's called out explicitly in the PR
  description per `proposal.md`'s non-goals).
