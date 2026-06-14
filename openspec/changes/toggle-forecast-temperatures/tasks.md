# Tasks: Toggle Forecast Temperatures

- [ ] **Task 1 — Create temperature utility**
  - File: `src/utils/temperature.js` (new file)
  - Implement two exported pure functions:
    - `toFahrenheit(celsius)` → `Math.round(celsius * 9 / 5 + 32)` (returns an integer)
    - `formatTemperature(celsius, unit)` → `"${Math.round(celsius)}°C"` when `unit !== 'F'`; `"${toFahrenheit(celsius)}°F"` when `unit === 'F'`
  - No React, no `localStorage`, no imports — pure functions only.
  - Verify: file exists and exports both functions; running `npx vitest run src/utils/temperature.test.js` passes (test file created in Task 2).

- [ ] **Task 2 — Unit tests for temperature utility**
  - File: `src/utils/temperature.test.js` (new file, next to the utility)
  - Tests to include:
    - `toFahrenheit(0)` → `32`
    - `toFahrenheit(100)` → `212`
    - `toFahrenheit(37)` → `99` (rounding: 37 × 9/5 + 32 = 98.6 → 99)
    - `formatTemperature(18, 'C')` → `"18°C"`
    - `formatTemperature(18, 'F')` → `"64°F"` (Math.round(18 × 9/5 + 32) = Math.round(64.4) = 64)
    - `formatTemperature(18, undefined)` → `"18°C"` (unknown unit falls back to Celsius)
    - `formatTemperature(18, 'X')` → `"18°C"` (unknown unit falls back to Celsius)
    - `formatTemperature(18.6, 'C')` → `"19°C"` (Celsius is also rounded)
  - Verify: `npx vitest run src/utils/temperature.test.js` passes with all cases green.

- [ ] **Task 3 — Add i18n keys to both locale files**
  - File: `src/locales/en/translation.json`
    - Add key: `"temperatureUnit": "Temperature unit"`
  - File: `src/locales/ja/translation.json`
    - Add key: `"temperatureUnit": "気温の単位"`
  - Do not change any existing key or remove any existing key.
  - Verify: both files remain valid JSON (parse without error); the new key appears in both.

- [ ] **Task 4 — Add `tempUnit` state and handler to `App.jsx`**
  - File: `src/App.jsx`
  - Add `tempUnit` state with lazy initializer (reads `localStorage.getItem('wyt:tempUnit')`, defaults to `'C'`, wrapped in try/catch):
    ```js
    const [tempUnit, setTempUnit] = useState(() => {
      try { return localStorage.getItem('wyt:tempUnit') || 'C'; } catch { return 'C'; }
    });
    ```
  - Add `handleToggleTempUnit` callback that flips the unit between `'C'` and `'F'` and writes the new value to `localStorage` (also in try/catch):
    ```js
    const handleToggleTempUnit = () => {
      const next = tempUnit === 'C' ? 'F' : 'C';
      setTempUnit(next);
      try { localStorage.setItem('wyt:tempUnit', next); } catch { /* ignore */ }
    };
    ```
  - Update the `<WeatherForecast>` JSX call to pass `unit={tempUnit}` and `onToggleUnit={handleToggleTempUnit}`.
  - Do not change any other state, handler, or JSX outside these additions.
  - Verify: `npx vitest run src/App.test.jsx` still passes.

- [ ] **Task 5 — Update `WeatherForecast.jsx` to render toggle and use `formatTemperature`**
  - File: `src/components/WeatherForecast.jsx`
  - Import `formatTemperature` from `'../utils/temperature'`.
  - Accept `unit` and `onToggleUnit` as props (destructure in the component signature alongside `weather` and `city`).
  - Add a toggle control inside the card (before the forecast grid), using two `<button type="button">` elements. Mark the active one with `className="active"`. Use `aria-label={t('temperatureUnit')}` on the wrapping `<div className="temp-unit-toggle">`.
  - Replace the hard-coded `{day.temp}°C` with `{formatTemperature(day.temp, unit)}`.
  - Preserve the existing early-return (`if (!weather || weather.length === 0) return null`) unchanged.
  - Verify: `npx vitest run src/components/WeatherForecast.test.jsx` passes if a test file exists; otherwise confirm the component renders correctly in the running dev server.

- [ ] **Task 6 — Add CSS for the toggle control**
  - File: `src/index.css` (append at the end, under a comment `/* Temperature unit toggle */`)
  - Styles for `.temp-unit-toggle` (inline-flex, border, border-radius), `.temp-unit-toggle button` (transparent background, padding, cursor), and `.temp-unit-toggle button.active` (accent background, white text, default cursor). Use existing CSS custom properties (e.g. `var(--color-accent)`) where available; fall back to literal values if they don't exist in the theme.
  - Do not modify any existing rule or variable.
  - Verify: visually check in the running dev server (`npm run dev`) that the active button is highlighted and toggling works.

- [ ] **Task 7 — Final quality gate**
  - Run `npm run lint` and fix any linting errors introduced by this change.
  - Run `npm run test:run` and fix any failing tests.
  - Run `npm run build` and fix any build errors.
  - All three commands must exit with code 0 before this task is considered done.
