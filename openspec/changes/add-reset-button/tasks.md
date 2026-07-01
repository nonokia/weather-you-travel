# Tasks: Add Reset Button

- [x] **Task 1 — Add i18n keys to both locale files**

  Files: `src/locales/en/translation.json`, `src/locales/ja/translation.json`

  Add a `"reset"` key to each file:
  - English: `"reset": "Reset"`
  - Japanese: `"reset": "リセット"`

  Verify: `npx vitest run src/App.test.jsx` still passes (no regressions from locale change).

- [x] **Task 2 — Add `handleReset` to App.jsx and pass `onReset` to FlightInput**

  Files: `src/App.jsx`

  Add `handleReset` inside the `App` component that resets every piece of app-owned state to its initial value:
  ```js
  const handleReset = () => {
    setDepartureData(null);
    setReturnData(null);
    setWeatherData(null);
    setError('');
    setLoading(false);
  };
  ```
  Do NOT clear `recentSearches` or `tempUnit`.

  Pass `onReset={handleReset}` as a prop to `<FlightInput>`.

  Verify: existing tests in `src/App.test.jsx` still pass (`npx vitest run src/App.test.jsx`).

- [x] **Task 3 — Add Reset button to FlightInput**

  Files: `src/components/FlightInput.jsx`

  1. Accept `onReset` in the destructured props: `const FlightInput = ({ onSearch, isLoading, onReset }) => { ... }`
  2. Add an internal handler that clears the component's local state and calls the prop:
     ```js
     const handleReset = () => {
       setDepartureFlight('');
       setReturnFlight('');
       onReset?.();
     };
     ```
  3. Add a `<button type="button" className="btn-secondary" onClick={handleReset}>{t('reset')}</button>` inside the form, rendered unconditionally, placed after the existing submit button.
  4. Use `t('reset')` — the key added in Task 1.

  Verify: the Reset button appears in the browser UI; clicking it empties both inputs and clears any displayed results.

- [x] **Task 4 — Add CSS for the secondary/reset button**

  Files: `src/index.css`

  Add a `.btn-secondary` rule that styles the reset button as a clearly secondary action (e.g. ghost/outlined style using CSS custom properties already defined in the file, such as `var(--primary-color)`). It must visually differ from `.btn-primary` so users don't confuse the two actions.

  Example (adapt to match existing theme variables):
  ```css
  .btn-secondary {
    background: transparent;
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s, color 0.2s;
  }
  .btn-secondary:hover {
    background: var(--primary-color);
    color: #ffffff;
  }
  ```

  Verify: both the search button and reset button are visible and visually distinct in the app.

- [x] **Task 5 — Write a test verifying reset clears inputs and results**

  Files: `src/App.test.jsx`

  1. **Update EVERY existing occurrence of the ambiguous `screen.getByRole('button')` selector** — there are six in this file today, and once the Reset button is added, ALL SIX will throw `TestingLibraryElementError: Found multiple elements with the role "button"` unless disambiguated (a fix that only updates some of them still leaves the suite red). Change every one of them to `screen.getByRole('button', { name: /get info|searching/i })` — this matches the submit button's rendered label in both its idle state ("Get Info") and loading state ("Searching..."); the test environment's i18n falls back to English, so this English-only regex is sufficient and must NOT also match the Reset button's label. The six lines to fix (as of this proposal — re-locate by searching the file for `getByRole('button')` if line numbers have drifted, and confirm the count is six before moving on):
     - Line 23: `expect(screen.getByRole('button')).toBeInTheDocument()` — in `'renders the header and the flight search input'`
     - Line 29: `fireEvent.click(screen.getByRole('button'))` — in `'shows validation error and does not call getFlightDetails for an invalid flight number'`
     - Line 43: `fireEvent.click(screen.getByRole('button'))` — in `'calls getFlightDetails and shows no validation error for a valid flight number'`
     - Line 71: `fireEvent.click(screen.getByRole('button'))` — in `'fetches return flight and weather for destination when return flight is provided'`
     - Line 90: `fireEvent.click(screen.getByRole('button'))` — in `'does not fetch weather when no return flight is given'`
     - Line 102: `fireEvent.click(screen.getByRole('button'))` — in `'shows error message when flight lookup fails'`

  2. **Add a new test** (inside the existing `describe('App', ...)` block):
     ```jsx
     it('reset button clears inputs and results', async () => {
       api.getFlightDetails.mockResolvedValue({
         flightNumber: 'JL123',
         airline: 'Japan Airlines',
         departure: { airport: 'NRT', city: 'Tokyo', time: '10:00' },
         arrival: { airport: 'LAX', city: 'Los Angeles', time: '23:00' },
       });

       render(<App />);
       const depInput = screen.getByLabelText(/departure flight/i);
       fireEvent.change(depInput, { target: { value: 'JL123' } });
       fireEvent.click(screen.getByRole('button', { name: /get info|searching/i }));
       await waitFor(() => expect(api.getFlightDetails).toHaveBeenCalledWith('JL123'));
       expect(await screen.findByText('Japan Airlines')).toBeInTheDocument();

       // Now reset
       fireEvent.click(screen.getByRole('button', { name: /reset/i }));

       // Input cleared
       expect(screen.getByLabelText(/departure flight/i)).toHaveValue('');
       // Results cleared (FlightInfo / airline name no longer visible)
       expect(screen.queryByText('Japan Airlines')).not.toBeInTheDocument();
     });
     ```

  Verify: `npx vitest run src/App.test.jsx` passes with no skipped or weakened tests, and confirm (e.g. via `grep -n "getByRole('button')" src/App.test.jsx`) that no bare, unqualified `getByRole('button')` call remains anywhere in the file.

- [x] **Task 6 — Final validation: lint, test, build**

  Run in sequence:
  ```bash
  npm run lint
  npm run test:run
  npm run build
  ```
  Fix any lint errors, test failures, or build errors that arise from the changes above. Do not skip or delete tests to force green — diagnose and fix the root cause.
