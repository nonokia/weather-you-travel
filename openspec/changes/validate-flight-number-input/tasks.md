# Tasks: Validate Flight Number Input

- [x] **Task 1 — Create `src/utils/flightValidation.js`**

  Create the file with the exported pure function:

  ```js
  export function isValidFlightNumber(value) {
    if (typeof value !== 'string') return false;
    return /^[A-Za-z0-9]{3,8}$/.test(value.trim());
  }
  ```

  Touch only: `src/utils/flightValidation.js` (new file).

  Verify: file exists and exports `isValidFlightNumber`.

- [ ] **Task 2 — Add unit tests in `src/utils/flightValidation.test.js`**

  Create `src/utils/flightValidation.test.js` with `describe('isValidFlightNumber', ...)` covering:

  - Valid: `'JL123'`, `'nh456'`, `'NH456'`, `'  JL123  '` (leading/trailing spaces), `'ABC'` (3 chars), `'ABCD1234'` (8 chars).
  - Invalid: `''` (empty), `'  '` (whitespace only), `'X'` (too short), `'AB'` (too short), `'ABCDEFGHI'` (9 chars, too long), `'JL-123'` (hyphen), `'JL 123'` (space inside), `123` (number, not string).

  Touch only: `src/utils/flightValidation.test.js` (new file).

  Verify: `npx vitest run src/utils/flightValidation.test.js` passes with all cases green.

- [ ] **Task 3 — Add i18n keys to `src/locales/en/translation.json`**

  Add one key to the English locale file:

  ```json
  "invalidFlightNumber": "Please enter a valid flight number (e.g. JL123)."
  ```

  Touch only: `src/locales/en/translation.json`.

  Verify: file is valid JSON and contains the `invalidFlightNumber` key.

- [ ] **Task 4 — Add i18n keys to `src/locales/ja/translation.json`**

  Add one key to the Japanese locale file:

  ```json
  "invalidFlightNumber": "有効な便名を入力してください（例: JL123）。"
  ```

  Touch only: `src/locales/ja/translation.json`.

  Verify: file is valid JSON and contains the `invalidFlightNumber` key.

- [ ] **Task 5 — Wire validation into `App.handleSearch` in `src/App.jsx`**

  The current `handleSearch` body begins (lines 19–20):
  ```js
  setLoading(true);
  setError('');
  ```

  Rewrite the top of `handleSearch` so the final order is:

  1. `setError('')` — clear any previous error (move it to the very top)
  2. `isValidFlightNumber` check for departure flight (new)
  3. `isValidFlightNumber` check for return flight when present (new)
  4. `setLoading(true)` — only reached when both inputs are valid

  Specifically:

  1. Import `isValidFlightNumber` from `'./utils/flightValidation'` at the top of the file.
  2. Replace the opening of `handleSearch` with:

     ```js
     setError('');
     if (!isValidFlightNumber(depFlightNum)) {
       setError(t('invalidFlightNumber'));
       return;
     }
     if (retFlightNum && !isValidFlightNumber(retFlightNum)) {
       setError(t('invalidFlightNumber'));
       return;
     }
     setLoading(true);
     ```

  3. Remove the original `setError('');` that previously appeared after `setLoading(true)` (it is now at the top).

  Touch only: `src/App.jsx`.

  Verify: submitting `''` or `'X!!'` never calls `getFlightDetails` and the error div text matches the `invalidFlightNumber` translation key. An empty return flight value (blank string or omitted) must NOT trigger validation.

- [ ] **Task 6 — Run quality checks and fix any fallout**

  Run the following in order and fix any failures before marking done:

  ```bash
  npm run lint
  npm run test:run
  npm run build
  ```

  Touch only files that need fixing to make the suite green. Do not skip or
  delete any existing tests.
