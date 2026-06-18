# Format Forecast Dates in a Friendly, Localized Way

## What

Replace the raw ISO date string (`2025-11-29`) rendered in each forecast day with a human-friendly, localized date such as `"Sat, Nov 29"` (English) or `"11月29日(土)"` (Japanese).

Implementation touches two areas:

1. **New pure utility** — `src/utils/formatDate.js`: exports `formatForecastDate(isoDate, locale)` which uses `Intl.DateTimeFormat` to produce a short weekday + month + day string, with safe handling of timezone drift and invalid input.
2. **Updated `WeatherForecast.jsx`** — replaces the bare `{day.date}` with `formatForecastDate(day.date, i18n.language)`, using the `i18n` object already available via `useTranslation`.

## Why

A raw ISO string (`2025-11-29`) is functional but unfriendly. A localized `"Sat, Nov 29"` reads naturally and matches the user's language, which the app already supports via i18next. This is a small, self-contained UX polish with no data-layer changes.

## Non-goals

- No changes to `src/services/api.js` or the data layer (dates stay ISO throughout; formatting is display-only).
- No new i18n translation strings (formatting is done entirely via `Intl`; no label is added).
- No E2E test changes.
- No changes to `.github/`, `package.json`, or unrelated components.
- No restyling of the forecast card beyond the date text itself.
