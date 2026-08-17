# Design: Real-API Fetch-Path Tests

## Why this needs a design note

The obvious test-writing approach — `vi.stubEnv` inside an `it()`, then call
the already-imported `getFlightDetails`/`getWeather` — does not exercise the
real-API branch, because `API_KEYS` in `api.js` is computed once at module
import time (see `proposal.md`). Vitest evaluates the top-level `import { ... }
from './api'` in `src/services/api.test.js` once, before any test body runs,
so `API_KEYS.AVIATIONSTACK`/`API_KEYS.OPENWEATHER` are frozen at `''` (no env
vars are set in the CI/test environment) for the entire file. Every test in
the existing file — including any naively-added ones — would therefore hit
the mock-fallback branch regardless of `vi.stubEnv`, making the new tests
falsely "pass" without covering the intended code.

## Pattern to use: stub env, reset modules, dynamic re-import

Inside the `describe('real-API code path', ...)` block (or a renamed/extended
version of it — see `tasks.md`), each new test that needs the real-API branch
must:

1. Call `vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key')` (or
   `VITE_OPENWEATHER_KEY` for the weather test) **before** importing the
   module under test.
2. Call `vi.resetModules()` so the next `import` re-evaluates `api.js` from
   scratch, picking up the stubbed env var into a fresh `API_KEYS`.
3. Dynamically `await import('./api')` to get the fresh instance, and use
   the functions from that import's result for the assertions in that test
   only (do not reuse the top-of-file static import in these specific
   tests).
4. Stub `fetch` with `vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve(payload) }))` (or `.mockRejectedValue(new Error(...))` for the
   error-fallback case) — this can happen before or after the dynamic
   import, since `fetch` is read at call time inside `getFlightDetails`/
   `getWeather`, not at module-eval time.
5. In `afterEach`, alongside the existing `vi.unstubAllGlobals()` /
   `vi.unstubAllEnvs()`, add `vi.resetModules()` so later tests in the file
   (including the existing mock-fallback tests, which rely on the
   static/top-level import and an unset env var) are unaffected.

Example shape for the success-path flight test:

```js
it('calls the real AviationStack API and maps the response when a key is present', async () => {
  const raw = {
    flight: { iata: 'JL123' },
    airline: { name: 'Japan Airlines' },
    departure: {
      iata: 'HND', airport: 'Haneda Airport',
      timezone: 'Asia/Tokyo', scheduled: '2026-07-01T10:00:00+00:00',
    },
    arrival: {
      iata: 'ITM', airport: 'Itami Airport',
      timezone: 'Asia/Osaka', scheduled: '2026-07-01T11:10:00+00:00',
    },
  };
  vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ data: [raw] }),
  }));
  vi.resetModules();
  const { getFlightDetails, mapAviationStackFlight } = await import('./api');

  const result = await getFlightDetails('JL123');

  expect(result).toEqual(mapAviationStackFlight(raw));
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toContain('flight_iata=JL123');
});
```

The weather success test follows the same shape with
`VITE_OPENWEATHER_KEY`, a `data.list`-shaped payload, and comparison against
`aggregateForecast(payload.list, days)`.

The fallback-on-error test reuses the same stub-env + resetModules + dynamic
import setup, but stubs `fetch` to reject (`vi.fn().mockRejectedValue(new
Error('network down'))`) and asserts the function still resolves with known
mock data (e.g. `getFlightDetails('JL123')` resolves to the `JL123` mock
fixture) rather than rejecting — proving the `catch` block's fallback runs
and the error is not left to propagate.

## Alternative considered and rejected

Moving the `import.meta.env.VITE_*` reads inside `getFlightDetails`/
`getWeather` (instead of the module-level `API_KEYS` object) would make
`vi.stubEnv` work without `vi.resetModules()`. Rejected: it's a production
code change to a file the issue explicitly scopes as test-only unless
"genuinely untestable as written" — and it IS testable as written via the
reset-and-reimport pattern above, so no production change is needed.
