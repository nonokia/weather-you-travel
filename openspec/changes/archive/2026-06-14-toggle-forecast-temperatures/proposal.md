# Toggle Forecast Temperatures Between °C and °F

## What

Add a °C / °F toggle to the weather forecast card so users can switch between Celsius and Fahrenheit. The preference is persisted to `localStorage` and survives page reloads.

Implementation touches four areas:

1. **New pure utility** — `src/utils/temperature.js`: `toFahrenheit(celsius)` and `formatTemperature(celsius, unit)`.
2. **State in `App.jsx`** — `tempUnit` state lazy-initialised from `localStorage` (`wyt:tempUnit`, default `'C'`), synced on change, passed to `WeatherForecast` as `unit` and `onToggleUnit`.
3. **Updated `WeatherForecast.jsx`** — renders the toggle and uses `formatTemperature` instead of the hard-coded `{day.temp}°C`.
4. **i18n** — accessible label key (`temperatureUnit`) added to both locale files.

## Why

Travelers from the US (and a handful of other regions) use Fahrenheit daily. Without a unit toggle the forecast is harder to parse at a glance. The fix is purely display-side — data stays in Celsius throughout, conversion happens only at render time.

## Non-goals

- No changes to `src/services/api.js` or the data layer.
- No E2E test additions (unit tests are sufficient for this utility).
- No changes to `.github/`, `package.json`, or unrelated components.
