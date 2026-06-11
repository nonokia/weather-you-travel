# Tasks: Validate Flight Number Input

- [ ] **Task 1 — Create `src/utils/flightValidation.js`**

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

  1. Import `isValidFlightNumber` from `'./utils/flightValidation'`.
  2. At the top of `handleSearch`, before `setLoading(true)`, validate the departure flight number:

     ```js
     if (!isValidFlightNumber(depFlightNum)) {
       setError(t('invalidFlightNumber'));
       return;
     }
     ```

  3. After that check, if `retFlightNum` is truthy, validate it too:

     ```js
     if (retFlightNum && !isValidFlightNumber(retFlightNum)) {
       setError(t('invalidFlightNumber'));
       return;
     }
     ```

  4. Add a `setError('')` call at the very start of the `try` block (it is
     already there — confirm it clears previous validation errors too, or move
     the `setError('')` to just before `setLoading(true)` if not already in
     that position).

  Touch only: `src/App.jsx`.

  Verify: manually confirm (or via App.test.jsx assertions) that submitting
  `''` or `'X!!'` never calls `getFlightDetails`, and the error div text
  matches the `invalidFlightNumber` translation key.

- [ ] **Task 6 — Run quality checks and fix any fallout**

  Run the following in order and fix any failures before marking done:

  ```bash
  npm run lint
  npm run test:run
  npm run build
  ```

  Touch only files that need fixing to make the suite green. Do not skip or
  delete any existing tests.
