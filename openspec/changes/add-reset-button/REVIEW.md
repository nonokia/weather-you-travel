VERDICT: approved

## Summary

The spec has been revised since the prior rejection and now correctly
addresses the defect that caused it: Task 5 updates all six occurrences of
the ambiguous `screen.getByRole('button')` selector in `src/App.test.jsx`,
not just two. I cross-checked the listed line numbers (23, 29, 43, 71, 90,
102) against the current file and they match exactly, and the replacement
selector `screen.getByRole('button', { name: /get info|searching/i })` does
not collide with the new Reset button's label ("Reset"/"リセット"). The
proposal is architecturally sound, in scope, and passes on all constitution
checks.

## Findings

### Passing checks

- **Scope**: only `src/App.jsx`, `src/components/FlightInput.jsx`,
  `src/index.css`, `src/App.test.jsx`, and both locale files are touched.
  `src/services/api.js`, `.github/`, `e2e/`, `package.json` are untouched. ✅
- **Architecture**: `handleReset` lives in `App.jsx`, the sole owner of
  app-level state per CLAUDE.md; `FlightInput` clears its own local input
  state and calls `onReset()` — consistent with the existing prop-down data
  flow. ✅
- **State fidelity**: proposed `handleReset` sets `departureData`,
  `returnData`, `weatherData` back to `null`, `error` to `''`, `loading` to
  `false` — verified against `App.jsx`'s actual `useState` initializers,
  which match exactly. `recentSearches` and `tempUnit` are correctly left
  untouched, matching the issue's explicit non-goal. ✅
- **i18n**: adds a `"reset"` key to both `src/locales/en/translation.json`
  and `src/locales/ja/translation.json`; neither file currently has a
  `reset` key, so no collision. ✅
- **Accessibility**: real `<button type="button">` with a `t()`-translated
  label, per the issue's implementer notes. ✅
- **Test correctness (the prior rejection reason)**: all six existing
  `getByRole('button')` call sites in `src/App.test.jsx` (verified at lines
  23, 29, 43, 71, 90, 102 in the current file) are covered by Task 5's
  instruction to disambiguate via `{ name: /get info|searching/i }`. This
  regex does not match "Reset", so the new button won't cause false
  matches. The new reset test uses `{ name: /reset/i }` to target it
  specifically. A literal implementation of Task 5 leaves no ambiguous
  selectors and no broken tests. ✅
- **No test weakening**: no existing test is skipped, deleted, or asserted
  more loosely; the change only disambiguates a selector that would
  otherwise become genuinely ambiguous once a second button exists. ✅
- **Security**: no credentials, no new client-side key exposure. ✅
- **Task quality**: six tasks, small and ordered (i18n → state → UI → CSS →
  tests → full validation), each names its files and a concrete verify
  step; Task 6 runs `npm run lint`, `npm run test:run`, `npm run build` in
  sequence and instructs fixing root causes rather than forcing green. ✅
- **No scope creep**: search logic, recent-search history, and temperature
  unit preference are explicitly left untouched; no unrelated UI restyling. ✅
