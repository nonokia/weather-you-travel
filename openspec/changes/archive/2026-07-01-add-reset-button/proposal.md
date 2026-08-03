# Add a Reset Button to Clear the Search

## What

Add a "Reset" button to the flight-search form that clears the current search in one action: empties both flight-number inputs and removes any displayed flight info, weather forecast, and error message, returning the app to its blank initial state.

## Why

After looking up a flight the user must manually delete each input field and the stale results remain visible until a new search runs. A single Reset control eliminates that friction and makes starting a fresh search instant.

## How (high-level)

- `handleReset` is added to `src/App.jsx` (which owns all app-level state). It restores `departureData`, `returnData`, `weatherData`, `error`, and `loading` to their initial values.
- `App` passes `onReset={handleReset}` to `<FlightInput>`.
- `FlightInput` accepts `onReset`, adds an internal `handleReset` that clears its local `departureFlight`/`returnFlight` state and then calls `onReset()`.
- A `<button type="button">` labelled via `t('reset')` is always visible in the form, styled as a secondary action beside the existing primary search button.
- New i18n keys are added to both locale files (`"reset": "Reset"` / `"reset": "リセット"`).

## Non-goals

- Does NOT clear `wyt:recentSearches` or `wyt:tempUnit` from localStorage — reset is about the current search only.
- No changes to `src/services/api.js`, the data layer, `e2e/`, `.github/`, or `package.json`.
- Does not restyle any unrelated UI.
