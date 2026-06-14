# Recent Flight Searches

## What

Persist the user's recent departure flight numbers to `localStorage` and render them as clickable chips below the flight input. Clicking a chip fills the departure field and immediately triggers the search — same as pressing the search button.

## Why

Users frequently re-check the same flight across visits (e.g. monitoring their own upcoming trip). One-tap history removes repetitive typing, improves retention without requiring accounts or a backend, and is the first "user retention" step called out in TASKS.md phase 4.

## Non-goals

- No return-flight history (departure only).
- No changes to the API data layer (`src/services/api.js`), E2E tests, `.github/`, or `package.json`.
- No account system or server-side persistence.
- No restyling of existing app components; dark-mode theme variables in `src/index.css` are untouched.
