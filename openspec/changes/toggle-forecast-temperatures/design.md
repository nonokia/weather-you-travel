# Design: Toggle Forecast Temperatures

## Data flow

```
localStorage (wyt:tempUnit)
        │  lazy init / persist on change
        ▼
App.jsx [tempUnit state + onToggleUnit handler]
        │  props: unit, onToggleUnit
        ▼
WeatherForecast.jsx
        │  calls
        ▼
formatTemperature(day.temp, unit)  ←  src/utils/temperature.js
```

Temperature values flow down as Celsius from the API layer; the only
conversion happens inside `formatTemperature` at render time.

## Utility module — `src/utils/temperature.js`

```js
export function toFahrenheit(celsius) {
  return Math.round(celsius * 9 / 5 + 32);
}

export function formatTemperature(celsius, unit) {
  if (unit === 'F') return `${toFahrenheit(celsius)}°F`;
  return `${Math.round(celsius)}°C`;
}
```

Rules:
- No React, no `localStorage`, no side effects — pure functions only.
- Any unit value other than `'F'` is treated as Celsius (defensive).
- Celsius values are `Math.round`-ed to be consistent with Fahrenheit output.

## State in `App.jsx`

```js
const [tempUnit, setTempUnit] = useState(() => {
  try {
    return localStorage.getItem('wyt:tempUnit') || 'C';
  } catch {
    return 'C';
  }
});

const handleToggleTempUnit = () => {
  const next = tempUnit === 'C' ? 'F' : 'C';
  setTempUnit(next);
  try { localStorage.setItem('wyt:tempUnit', next); } catch { /* ignore */ }
};
```

Passed to `WeatherForecast` as `unit={tempUnit}` and `onToggleUnit={handleToggleTempUnit}`.

## Toggle UI in `WeatherForecast.jsx`

A pair of `<button type="button">` elements styled with a CSS active class:

```jsx
<div className="temp-unit-toggle" aria-label={t('temperatureUnit')}>
  <button
    type="button"
    className={unit !== 'F' ? 'active' : ''}
    onClick={() => unit === 'F' && onToggleUnit()}
  >
    °C
  </button>
  <button
    type="button"
    className={unit === 'F' ? 'active' : ''}
    onClick={() => unit !== 'F' && onToggleUnit()}
  >
    °F
  </button>
</div>
```

The `°C` / `°F` symbols are not translated (they are universal symbols);
only the accessible `aria-label` text goes through `t()`.

## CSS (in existing `src/index.css` or component CSS file)

```css
.temp-unit-toggle {
  display: inline-flex;
  gap: 0;
  border: 1px solid var(--color-border, #444);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.temp-unit-toggle button {
  background: transparent;
  border: none;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  color: var(--color-text-secondary, #aaa);
  font-size: 0.85rem;
}

.temp-unit-toggle button.active {
  background: var(--color-accent, #4a9eff);
  color: #fff;
  cursor: default;
}
```

## i18n keys

| key | en | ja |
|---|---|---|
| `temperatureUnit` | `"Temperature unit"` | `"気温の単位"` |

## Affected files

| File | Change |
|---|---|
| `src/utils/temperature.js` | New |
| `src/utils/temperature.test.js` | New |
| `src/App.jsx` | Add `tempUnit` state + handler; pass props to `WeatherForecast` |
| `src/components/WeatherForecast.jsx` | Accept `unit`+`onToggleUnit` props; render toggle; use `formatTemperature` |
| `src/index.css` | Add `.temp-unit-toggle` styles |
| `src/locales/en/translation.json` | Add `temperatureUnit` key |
| `src/locales/ja/translation.json` | Add `temperatureUnit` key |
