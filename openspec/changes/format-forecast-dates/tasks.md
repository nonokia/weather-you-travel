# Tasks: Format Forecast Dates

- [x] **Task 1 — Create `formatDate` utility**
  - File: `src/utils/formatDate.js` (new file)
  - Export one pure function:
    ```js
    export function formatForecastDate(isoDate, locale) {
      if (!isoDate) return isoDate;
      try {
        // Append T00:00:00 to force local-calendar parsing and avoid UTC midnight drift.
        const date = new Date(`${isoDate}T00:00:00`);
        if (isNaN(date.getTime())) return isoDate;
        return new Intl.DateTimeFormat(locale, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }).format(date);
      } catch {
        return isoDate;
      }
    }
    ```
  - No React, no i18next imports — pure function only; `locale` is passed in by the caller.
  - Verify: file exists and exports `formatForecastDate`; the unit tests added in Task 2 pass.

- [x] **Task 2 — Unit tests for `formatForecastDate`**
  - File: `src/utils/formatDate.test.js` (new file, next to the utility)
  - Tests to include (assert on stable substrings; avoid exact punctuation which varies by runtime):
    - Valid date, English locale: `formatForecastDate('2025-11-29', 'en')` — the result contains `'29'` and one of `['Nov', 'November']`.
    - Valid date, English locale: result contains `'Sat'` or `'Saturday'` (2025-11-29 is a Saturday).
    - Valid date, Japanese locale: `formatForecastDate('2025-11-29', 'ja')` — result contains `'29'` and `'11'` (day and month digits appear).
    - Invalid input: `formatForecastDate('not-a-date', 'en')` returns `'not-a-date'` unchanged.
    - Empty string: `formatForecastDate('', 'en')` returns `''` unchanged.
    - Null/undefined: `formatForecastDate(null, 'en')` returns `null` unchanged; `formatForecastDate(undefined, 'en')` returns `undefined` unchanged.
  - Verify: `npx vitest run src/utils/formatDate.test.js` passes with all cases green.

- [x] **Task 3 — Update `WeatherForecast.jsx` to use `formatForecastDate`**
  - File: `src/components/WeatherForecast.jsx`
  - Import `formatForecastDate` from `'../utils/formatDate'`.
  - Destructure `i18n` from the existing `useTranslation()` call:
    ```js
    const { t, i18n } = useTranslation();
    ```
  - Replace `{day.date}` with `{formatForecastDate(day.date, i18n.language)}`.
  - Do not change anything else: preserve the early return, the temperature toggle from #28 (`unit`, `onToggleUnit`, `formatTemperature`), all class names, and all other JSX.
  - Verify: `npx vitest run src/App.test.jsx` still passes; visually confirm the forecast shows a friendly date in the running dev server.

- [ ] **Task 4 — Final quality gate**
  - Run `npm run lint` and fix any linting errors introduced by this change.
  - Run `npm run test:run` and fix any failing tests.
  - Run `npm run build` and fix any build errors.
  - All three commands must exit with code 0 before this task is considered done.
