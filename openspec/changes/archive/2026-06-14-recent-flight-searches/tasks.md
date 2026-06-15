# Tasks: Recent Flight Searches

- [x] **Task 1 — Create `src/utils/searchHistory.js`**

  Create a new file `src/utils/searchHistory.js` that exports:
  - `getRecentSearches()` — reads `localStorage` key `wyt:recentSearches`, parses JSON, returns the array or `[]` on any error (missing key, invalid JSON, storage disabled). Never throws.
  - `addRecentSearch(flightNumber)` — normalise to trimmed uppercase; prepend to the existing list; remove any prior occurrence of the same value (case-insensitive de-dup); cap at 5 entries; persist back to `localStorage` (wrapped in try/catch for private-mode safety); return the new array.

  Verify: the unit test file in Task 2 passes when run with `npx vitest run src/utils/searchHistory.test.js`.

- [x] **Task 2 — Add unit tests `src/utils/searchHistory.test.js`**

  Create `src/utils/searchHistory.test.js` using Vitest globals (`describe`, `it`, `expect`, `beforeEach`). Before each test, clear `localStorage` and reset the module if needed (use `localStorage.clear()`). Cover:
  1. `getRecentSearches()` returns `[]` when localStorage is empty.
  2. `getRecentSearches()` returns `[]` when localStorage value is corrupt (non-JSON string).
  3. `addRecentSearch` stores and returns a single entry normalised to uppercase.
  4. `addRecentSearch` called twice with different values returns most-recent-first order.
  5. `addRecentSearch` de-duplicates case-insensitively (adding `"jl123"` when `"JL123"` already exists moves it to the front, keeping only one entry).
  6. `addRecentSearch` caps the list at 5 entries (add 6 values; only 5 remain, oldest dropped).

  Verify: `npx vitest run src/utils/searchHistory.test.js` — all tests green.

- [x] **Task 3 — Add i18n keys to both locale files**

  Edit `src/locales/en/translation.json`: add `"recentSearches": "Recent searches"`.
  Edit `src/locales/ja/translation.json`: add `"recentSearches": "最近の検索"`.

  Verify: `npx vitest run` still passes; no keys missing in either file.

- [x] **Task 4 — Create `src/components/RecentSearches.jsx` and `src/components/RecentSearches.css`**

  Create `src/components/RecentSearches.jsx`:
  - Accepts props `searches` (string array) and `onSelect` (function).
  - Returns `null` when `searches` is empty or length is 0.
  - Otherwise renders a `<div className="recent-searches">` containing:
    - A `<span className="recent-searches-label">{t('recentSearches')}</span>` (uses `useTranslation`).
    - One `<button className="recent-chip" onClick={() => onSelect(s)}>` per entry `s`.
  - Import and use `./RecentSearches.css`.

  Create `src/components/RecentSearches.css`:
  - `.recent-searches`: flex row, wrap, gap, top margin to separate from FlightInput card.
  - `.recent-searches-label`: muted text colour using `var(--color-text-muted)` or equivalent.
  - `.recent-chip`: pill-shaped button using existing CSS variables (`--color-surface`, `--color-accent`, etc.); no new root variables.

  Verify: component renders without errors in the dev server; inspect in browser (Task 6).

- [x] **Task 5 — Wire `RecentSearches` into `src/App.jsx`**

  In `src/App.jsx`:
  1. Import `RecentSearches` from `./components/RecentSearches`.
  2. Import `addRecentSearch`, `getRecentSearches` from `./utils/searchHistory`.
  3. Add state: `const [recentSearches, setRecentSearches] = useState(() => getRecentSearches());`
  4. In `handleSearch`, inside the `try` block, immediately after `setDepartureData(depFlight)` (the line that sets departure data on success), call:
     `setRecentSearches(addRecentSearch(depFlightNum));`
     This ensures history is only updated on a successful departure-flight lookup.
  5. Add handler: `const handleRecentSelect = (flightNumber) => { handleSearch(flightNumber, ''); };`
  6. In JSX, place `<RecentSearches searches={recentSearches} onSelect={handleRecentSelect} />` directly below the `<FlightInput ... />` line.

  Verify: `npx vitest run src/App.test.jsx` still passes; dev server shows chips after a successful search.

- [x] **Task 6 — Run lint, tests, and build; fix any fallout**

  Run the following in order and fix any errors before marking done:
  ```
  npm run lint
  npm run test:run
  npm run build
  ```
  All three must exit with code 0. Do not delete or skip any existing test to force green.
