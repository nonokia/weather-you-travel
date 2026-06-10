# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Weather You Travel" — a React app that takes a flight number, looks up the flight's route, and shows the weather at the destination for the dates of travel. Currently a prototype moving toward commercialization. Project planning docs (`PROJECT_KNOWLEDGE.md`, `TASKS.md`, `ROADMAP.md`) are written in Japanese; read them for current status and next steps.

## Commands

```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # Production build to dist/
npm run lint         # ESLint over the repo
npm test             # Vitest in watch mode
npm run test:ui      # Vitest with the browser UI
npm run test:e2e     # Playwright E2E (auto-starts the dev server)
```

Run a single unit test: `npx vitest run src/App.test.jsx` (or `npx vitest -t "test name"`).
Run a single E2E test: `npx playwright test e2e/example.spec.js`.

## Architecture

- **Stack**: React 19 + Vite 7, plain JavaScript/JSX (no TypeScript — migration is a future goal). Styling is vanilla CSS; global theme variables (premium dark mode) live in `src/index.css`.
- **Data layer — `src/services/api.js`**: This is the single source of all data fetching; components never fetch directly. It exports `getFlightDetails(flightNumber)` and `getWeather(city, days)`. Each function tries the real API first when an API key is present, and **falls back to in-file mock data** on missing key or error. Keep this dual-path (real + mock) pattern when extending — the app must keep working without keys.
  - Flights: AviationStack (`VITE_AVIATIONSTACK_KEY`). Mock flight numbers: `JL123`, `NH456`, `JL999`.
  - Weather: OpenWeatherMap (`VITE_OPENWEATHER_KEY`). Keyed by destination city name.
  - API keys come from Vite env vars in `.env` (`import.meta.env.VITE_*`); `.env` is committed with empty placeholders.
- **State flow**: `src/App.jsx` holds all app state (departure/return flight, weather, loading, error) and orchestrates the search. `handleSearch` fetches the departure flight, then—only if a return flight is given—the return flight and the destination weather. Presentational components (`FlightInput`, `FlightInfo`, `WeatherForecast`, `Skeleton`) receive data via props.
- **i18n — `src/i18n.js`**: i18next with browser language detection, English/Japanese, `fallbackLng: 'en'`. Strings live in `src/locales/{en,ja}/translation.json`; use the `t()` hook from `react-i18next` rather than hardcoding UI text, and add keys to both locale files.

## Testing

- Unit/component tests: Vitest + Testing Library, jsdom environment, globals enabled, setup in `src/setupTests.js`. Test files are `*.test.jsx` next to source.
- E2E: Playwright (Chromium), tests in `e2e/`, base URL `http://localhost:5173`; the config starts `npm run dev` automatically.

## Multi-agent workflow

This repo is set up for parallel agent work (see `PROJECT_KNOWLEDGE.md`). Before starting a task, mark it in `TASKS.md`: `[ ]` → `[/]` (in progress) → `[x]` (done), and update `PROJECT_KNOWLEDGE.md` if you change the architecture. Suggested separation: data work in `src/services/`, UI work in `src/components/` + CSS, test work in test files only.
