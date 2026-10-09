# Repository Guidelines

## Project Structure & Module Organization

Glyph Keepers is a local browser typing game built with Vue 3, TypeScript, and Vite. Curated prompt pools live in `src/data/curriculum.ts`; creature definitions live in `src/data/creatures.ts`. Keep typing validation, expedition state, metrics, rewards, and persistence in separate modules under `src/game/`. Vue presentation belongs in `src/components/` and `src/App.vue`; shared styling belongs in `src/style.css`. Use original pixel SVG artwork and local assets.

## Build, Test, and Development Commands

- `npm install`: install dependencies; use `npm.cmd` if PowerShell blocks npm scripts.
- `npm run dev`: start the local Vite development server.
- `npm run build`: type-check with vue-tsc and generate production files in `dist/`.
- `npm run preview`: serve the production build locally.
- `npm test`: run Vitest tests once.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes, and TypeScript strict mode. Prefer descriptive camelCase functions and variables, PascalCase component filenames, and explicit types for saved records and game phases. Keep domain logic independent of presentation. Match the existing semicolon-free TypeScript style. No formatter or linter is configured.

## Testing Guidelines

Place Vitest tests beside domain modules as `*.test.ts`. Cover damage re-arming, printable attempt accounting, pause timing, normalized reward probabilities, save validation, and reward persistence. There is no numerical coverage threshold. Manually verify ten encounters, retreat, refresh during hatching, keyboard operation, and reduced motion before submitting gameplay changes.

## Commit & Pull Request Guidelines

This repository has no established commit history. Use concise imperative messages such as `Add expedition state machine`. Pull requests should describe player-visible behavior, link relevant issues, list validation performed, and include screenshots for interface changes. Document changes to scoring or save formats in the README.

## Game Invariants

Slow, accurate typing must always allow progress. Disable input outside active encounters. Persist rewards before hatch presentation, version saves, and handle malformed storage. Keep player data local; do not introduce external services or deploy without explicit authorization.
