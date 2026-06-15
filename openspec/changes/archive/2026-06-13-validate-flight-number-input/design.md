# Design: Validate Flight Number Input

## Overview

A pure validation utility is added in `src/utils/flightValidation.js`. It is
called from `App.handleSearch` before any `getFlightDetails` invocations. When
validation fails the function sets an i18n error string on the existing `error`
state variable and returns early without touching the API.

## Validation rule

```
isValidFlightNumber(value):
  trimmed = value.trim()
  return /^[A-Za-z0-9]{3,8}$/.test(trimmed)
```

- **3–8 alphanumeric characters** after trimming covers the full range of
  real-world IATA flight identifiers (e.g. `JL1`, `UA2459`, `AFKLM1`) while
  rejecting empty strings, whitespace, symbols, and pathologically long inputs.
- Case-insensitive by construction (both `JL123` and `jl123` pass).
- Deliberately lenient: no airline-code allow-list, no numeric suffix check.

## File changes

| File | Change |
|---|---|
| `src/utils/flightValidation.js` | **New** — exports `isValidFlightNumber` |
| `src/utils/flightValidation.test.js` | **New** — unit tests for the function |
| `src/App.jsx` | Call `isValidFlightNumber` at the top of `handleSearch`; set `error` and return early on failure |
| `src/locales/en/translation.json` | Add `invalidFlightNumber` key |
| `src/locales/ja/translation.json` | Add `invalidFlightNumber` key |

## Data-flow diagram

```
User submits form
      │
      ▼
FlightInput.handleSubmit
      │ calls onSearch(dep, ret)
      ▼
App.handleSearch
      │
      ├─ isValidFlightNumber(dep) == false?
      │       └─ setError(t('invalidFlightNumber')), return   ← no API call
      │
      ├─ retFlightNum && isValidFlightNumber(ret) == false?
      │       └─ setError(t('invalidFlightNumber')), return   ← no API call
      │
      └─ proceed to getFlightDetails(dep) ...
```

## Why not validate inside FlightInput?

The issue spec says validation messages should appear in-place (as the existing
`error` div in `App.jsx` already does), and `App.handleSearch` is the
orchestration point that decides whether to call the API. Placing validation
there keeps `FlightInput` a pure presenter and avoids duplicating state.
