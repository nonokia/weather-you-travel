# Tasks: Add Reset Button

- [ ] **Task 1 — Add i18n keys to both locale files**

  Files: `src/locales/en/translation.json`, `src/locales/ja/translation.json`

  Add a `"reset"` key to each file:
  - English: `"reset": "Reset"`
  - Japanese: `"reset": "リセット"`

  Verify: `npx vitest run src/App.test.jsx` still passes (no regressions from locale change).

- [ ] **Task 2 — Add `handleReset` to App.jsx and pass `onReset` to FlightInput**

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

- [ ] **Task 3 — Add Reset button to FlightInput**

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

- [ ] **Task 4 — Add CSS for the secondary/reset button**

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

- [ ] **Task 5 — Write a test verifying reset clears inputs and results**

  Files: `src/App.test.jsx`

  1. **Update the ambiguous button selector** in the existing test `'renders the header and the flight search input'`: change `screen.getByRole('button')` to `screen.getAllByRole('button')` and assert the returned array has at least one element, OR use a more specific query like `screen.getByRole('button', { name: /get info/i })`. This prevents the test from breaking due to the second button being added.

  2. **Also update the validation-error test** (`'shows validation error...'`) which uses `screen.getByRole('button')` to click the submit button — change it to `screen.getByRole('button', { name: /get info|search/i })` (the submit button's label text) so it targets only the submit button, not the new Reset button.

  3. **Add a new test** (inside the existing `describe('App', ...)` block):
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
       fireEvent.click(screen.getByRole('button', { name: /get info|search/i }));
       await waitFor(() => expect(api.getFlightDetails).toHaveBeenCalledWith('JL123'));

       // Now reset
       fireEvent.click(screen.getByRole('button', { name: /reset|リセット/i }));

       // Input cleared
       expect(screen.getByLabelText(/departure flight/i)).toHaveValue('');
       // Results cleared (FlightInfo / airline name no longer visible)
       expect(screen.queryByText('Japan Airlines')).not.toBeInTheDocument();
     });
     ```

  Verify: `npx vitest run src/App.test.jsx` passes with no skipped or weakened tests.

- [ ] **Task 6 — Final validation: lint, test, build**

  Run in sequence:
  ```bash
  npm run lint
  npm run test:run
  npm run build
  ```
  Fix any lint errors, test failures, or build errors that arise from the changes above. Do not skip or delete tests to force green — diagnose and fix the root cause.
