# Proposal: Validate Flight Number Input Before Searching

## What

Add client-side validation for flight number inputs so that obviously invalid
values (empty, whitespace-only, too short/long, non-alphanumeric) are rejected
before any API call is made, and a clear, localized error message is shown
inline.

## Why

Currently, submitting a blank or nonsense flight number sends a request to
`getFlightDetails`, which fails with a generic "flight not found" error. That
error gives users no guidance on what went wrong. Pre-validation provides
immediate, actionable feedback ("Please enter a valid flight number") and
eliminates wasteful API calls for inputs that can never succeed.

## Non-goals

- Server-side or database validation of real IATA flight numbers.
- Blocking valid but unusual formats (e.g. 3-letter airline codes like "AAL").
- Changes to the existing `FlightInput` component's DOM structure or styling.
- Any changes to `.github/`, `e2e/`, or `package.json`.
