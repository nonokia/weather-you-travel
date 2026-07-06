# Tasks: Real-API Fetch-Path Test Coverage

All tasks touch only **`src/services/api.test.js`**. Add all new tests inside
the existing `describe('real-API code path', ...)` block (keep the existing
`afterEach` and the existing `aggregateForecast` test as-is — do not delete or
rewrite them). Add a `beforeEach(() => { vi.resetModules(); })` inside that
same describe block if it isn't already there, so every test in the block
gets a fresh module instance to import.

- [x] **Task 1 — Success path: `getFlightDetails` with a stubbed AviationStack fetch**
  - File: `src/services/api.test.js`
  - Inside the `real-API code path` describe block, add:
    ```js
    it('fetches and maps a real AviationStack flight when the API key is set', async () => {
      const raw = {
        flight: { iata: 'JL123' },
        airline: { name: 'Japan Airlines' },
        departure: {
          iata: 'HND',
          airport: 'Haneda Airport',
          timezone: 'Asia/Tokyo',
          scheduled: '2026-07-01T10:00:00+00:00',
        },
        arrival: {
          iata: 'ITM',
          airport: 'Itami Airport',
          timezone: 'Asia/Osaka',
          scheduled: '2026-07-01T11:10:00+00:00',
        },
      };
      vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ data: [raw] }),
      }));

      const { getFlightDetails, mapAviationStackFlight } = await import('./api');
      const result = await getFlightDetails('JL123');

      expect(result).toEqual(mapAviationStackFlight(raw));
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][0]).toContain('flight_iata=JL123');
    });
    ```
  - `mapAviationStackFlight` is already imported at the top of the file (pure
    helper, unaffected by module reset) — reuse it to build the expected
    value instead of hand-writing the mapped shape again.
  - Verify: `npx vitest run src/services/api.test.js -t "fetches and maps a real AviationStack flight"` passes.

- [x] **Task 2 — Success path: `getWeather` with a stubbed OpenWeatherMap fetch**
  - File: `src/services/api.test.js`
  - Inside the same describe block, add:
    ```js
    it('fetches and aggregates a real OpenWeatherMap forecast when the API key is set', async () => {
      const list = Array.from({ length: 24 }, (_, i) => ({
        dt_txt: `2026-07-0${Math.floor(i / 8) + 1} ${String((i % 8) * 3).padStart(2, '0')}:00:00`,
        main: { temp: 20 + i * 0.4 },
        weather: [{ main: i % 2 === 0 ? 'Clear' : 'Rain' }],
      }));
      vi.stubEnv('VITE_OPENWEATHER_KEY', 'test-key');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ list }),
      }));

      const { getWeather, aggregateForecast } = await import('./api');
      const result = await getWeather('Osaka', 3);

      expect(result).toEqual(aggregateForecast(list, 3));
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][0]).toContain('q=Osaka');
    });
    ```
  - `aggregateForecast` is already imported at the top of the file — reuse it
    to build the expected value.
  - Verify: `npx vitest run src/services/api.test.js -t "fetches and aggregates a real OpenWeatherMap forecast"` passes.

- [ ] **Task 3 — Fallback path: network error and unexpected response shape**
  - File: `src/services/api.test.js`
  - Inside the same describe block, add four tests covering both functions x
    both failure modes:
    ```js
    it('falls back to mock flight data when the AviationStack fetch rejects', async () => {
      vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key');
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

      const { getFlightDetails } = await import('./api');
      const result = await getFlightDetails('JL123');

      expect(result.flightNumber).toBe('JL123');
      expect(result.arrival.city).toBe('Osaka');
    });

    it('falls back to mock flight data when AviationStack returns an unexpected shape', async () => {
      vi.stubEnv('VITE_AVIATIONSTACK_KEY', 'test-key');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ error: 'rate limited' }), // no `data` key
      }));

      const { getFlightDetails } = await import('./api');
      const result = await getFlightDetails('JL123');

      expect(result.flightNumber).toBe('JL123');
    });

    it('falls back to mock weather data when the OpenWeatherMap fetch rejects', async () => {
      vi.stubEnv('VITE_OPENWEATHER_KEY', 'test-key');
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

      const { getWeather } = await import('./api');
      const result = await getWeather('Osaka', 2);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('temp');
    });

    it('falls back to mock weather data when OpenWeatherMap returns an unexpected shape', async () => {
      vi.stubEnv('VITE_OPENWEATHER_KEY', 'test-key');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ error: 'rate limited' }), // no `list` key
      }));

      const { getWeather } = await import('./api');
      const result = await getWeather('Osaka', 2);

      expect(result).toHaveLength(2);
    });
    ```
  - None of these four should throw — `getFlightDetails`/`getWeather` must
    resolve via the existing mock-data fallback path.
  - Verify: `npx vitest run src/services/api.test.js -t "falls back to mock"` — all 4 pass.

- [ ] **Task 4 — Final quality gate**
  - Run `npm run lint` and fix any linting errors introduced by this change
    (e.g. unused imports if any test is trimmed down).
  - Run `npm run test:run` and fix any failing tests — the full suite,
    including all pre-existing tests in `src/services/api.test.js` and
    elsewhere, must pass.
  - Run `npm run build` and fix any build errors.
  - All three commands must exit with code 0 before this task is considered
    done.
