# Design: Recent Flight Searches

## Architecture overview

```
localStorage ("wyt:recentSearches")
       ↓ read on mount / write after success
src/utils/searchHistory.js   ← pure utility, no React
       ↓ imported by
src/App.jsx                  ← holds recentSearches state, calls addRecentSearch after successful dep lookup
       ↓ passes recentSearches + onChipClick props
src/components/RecentSearches.jsx  ← presentational; renders chips, fires onChipClick(flightNumber)
```

## Data contract

### `src/utils/searchHistory.js`

| Export | Signature | Behaviour |
|---|---|---|
| `addRecentSearch` | `(flightNumber: string) => string[]` | Normalise to trimmed uppercase. Prepend to list, remove any prior occurrence of same value (case-insensitive de-dup), cap at 5. Persist to `localStorage`. Return new list. |
| `getRecentSearches` | `() => string[]` | Read from `localStorage`; return `[]` on any error (missing key, parse failure). Never throws. |

Storage key: `wyt:recentSearches`. Value: JSON array of uppercase flight-number strings, max length 5.

### `src/components/RecentSearches.jsx`

Props:
- `searches: string[]` — list from state (may be empty).
- `onSelect: (flightNumber: string) => void` — called when a chip is clicked.

Renders nothing (`null`) when `searches` is empty. Otherwise renders a labelled chip list using i18n key `recentSearches`.

## State wiring in `src/App.jsx`

1. Add `const [recentSearches, setRecentSearches] = useState(() => getRecentSearches())` — lazy initialiser reads localStorage once on mount.
2. In `handleSearch`, after `setDepartureData(depFlight)` succeeds (i.e. no throw), call `setRecentSearches(addRecentSearch(depFlightNum))`.
3. Add `onChipClick` handler:
   ```js
   const handleRecentSelect = (flightNumber) => {
     handleSearch(flightNumber, '');
   };
   ```
4. Render `<RecentSearches searches={recentSearches} onSelect={handleRecentSelect} />` immediately below `<FlightInput>`.

## CSS

Add `src/components/RecentSearches.css` with scoped styles for `.recent-searches`, `.recent-searches-label`, and `.recent-chip` button elements. Use existing CSS custom properties from `src/index.css` (e.g. `--color-surface`, `--color-accent`, `--color-text-muted`) so chips match the dark-mode theme without adding new variables.

## localStorage error handling

Both `addRecentSearch` and `getRecentSearches` wrap `localStorage` access in try/catch. In private-browsing or environments where storage is disabled, the utility degrades gracefully: `getRecentSearches` returns `[]`, `addRecentSearch` returns the in-memory list without persisting.

## i18n keys

| Key | EN | JA |
|---|---|---|
| `recentSearches` | `Recent searches` | `最近の検索` |
