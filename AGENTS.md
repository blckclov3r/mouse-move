# AGENTS.md

## Commands

- `npm install --ignore-scripts` — use this for dependencies. Plain `npm install` / `npm ci` runs the `prepare` script, which invokes `npm run start` and launches the infinite mouse-moving app.
- `npm test` — Node's test runner via `tsx`, executing `src/**/*.test.ts`. Tests live beside the code and are excluded from builds by `tsconfig.build.json`.
- `npm run build` — cleans `dist/`, then compiles `src/` with `tsconfig.build.json` (CommonJS, `strict`).
- `npx tsc --noEmit` — typecheck source and tests; there is no `typecheck` script.
- `npm run lint` / `npm run lint:fix` — ESLint 9 flat config in `eslint.config.js`. `.eslintrc.json` is legacy and ignored by ESLint 9; edit `eslint.config.js`.
- Verification order: `npm run lint` → `npx tsc --noEmit` → `npm test`; CI also runs `npm run build`.
- CI (`.github/workflows/ci.yml`) uses Node 22 and `npm ci --ignore-scripts`; never replace that with plain `npm install`/`npm ci`, or the `prepare` script launches the app.
- Avoid `npm start` unless specifically requested: it runs forever and moves the real cursor.

## Architecture

- `src/index.ts` is wiring only: it creates the adapters and session, registers SIGINT/SIGTERM, and calls `session.stop()` + `process.exit(0)`.
- `src/session.ts` is the deep module. Its interface is `createSession(config, {pointer, probe, display})` returning `{start, stop}`; it owns polling, idle detection, the square drawing, the configurable idle-operation timeout (10s default), connectivity transitions, and shutdown state.
- `src/pointer.ts`, `src/probe.ts`, and `src/display.ts` are the production adapters: nut-js cursor I/O, `fetch` connectivity checks, and TTY/plain output. `src/display.ts` contains the logger state and banner.
- `src/const.ts` reads config once at import (cached): `MOUSE_SQUARE_SIZE` (5), `MOUSE_MOVEMENT_SPEED` (28 ms between points), `MOUSE_CHECK_INTERVAL` (15000 ms). Set env vars before starting the process.
- `src/session.test.ts` tests the session through fakes for pointer, probe, and display; it uses `node:test` and mocks only `setInterval`, so drawing still uses real 0ms timers. `src/probe.test.ts` covers empty URL lists and caller-abort propagation.
- `Condition` and `SessionEvent` in `src/session.ts` are closed literal unions; extend the union before adding a status or event message. `SessionConfig` and `Position` are readonly.
- `.github/workflows/ci.yml` is verification-only: lint, typecheck, tests, build, then upload `dist`; `spec/spec-process-cicd-ci.md` is its behavior spec. `.github/dependabot.yml` opens weekly npm and GitHub Actions update PRs.


## Gotchas

- Live status rendering only happens when stdout is a TTY and `CI` is unset (`src/display.ts`); in CI or redirected output only error/info lines are printed.
- `npm test` mocks `setInterval` but not `setTimeout`; session logic that waits on drawing or the configurable idle-operation timeout still uses real timers.
- `npm run pkg` outputs executables to `./app`, and its CLI `--targets node18-*` overrides `pkg.targets` (`node22-*`) in `package.json`. `pkg` is not a declared dependency, so `npx` fetches it on demand.
- Square coordinates are absolute screen pixels with no bounds clamping; squares near an edge can go off-screen.
- nut-js needs a real desktop session and OS permissions (Accessibility on macOS, display access on Linux); it will not work headless.
