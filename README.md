# Mouse Move

This application demonstrates mouse control and logging using TypeScript. It moves the mouse to draw a square when the
pointer stays idle between checks and performs network connectivity checks. This application is intended solely for
testing and educational purposes.

## Features

- **Mouse Control**: Draws a square on the screen when the mouse stays in the same position between checks.
- **Network Monitoring**: Checks connectivity during each idle operation and at startup.

## Prerequisites

- **Node.js**: Node.js 22 LTS or newer (the CI workflow uses Node 22).
- **TypeScript**: The project uses TypeScript for type safety.

## Installation

1. **Clone the repository**:

    ```sh
    git clone https://github.com/blckclov3r/mouse-move.git
    cd mouse-move
    ```

2. **Install dependencies**:

    ```sh
    npm install --ignore-scripts
    ```

    The `--ignore-scripts` flag prevents the `prepare` script from running `npm start` during installation. Start the
    application explicitly when you are ready.

## Scripts

- **`npm run start`**: Builds the TypeScript files and runs the application.
- **`npm run build`**: Cleans `dist/` and compiles TypeScript files into JavaScript.
- **`npm test`**: Runs the automated tests with Node's test runner.
- **`npm run lint`**: Lints the TypeScript sources.
- **`npx tsc --noEmit`**: Type-checks the sources and tests without emitting files.
- **`npm run pkg`**: Packages the application for different platforms (macOS, Windows).

## Continuous Integration

GitHub Actions runs lint, typecheck, tests, and build on pushes and pull requests to `master` or `main`. The workflow
uses Node 22 and `npm ci --ignore-scripts`; see `.github/workflows/ci.yml`. Dependabot checks npm and GitHub Actions
weekly.

## Usage

1. **Start the application**:

   Execute the following command to start the application. When the mouse stays in the same position between checks, it
   draws a square and performs a connectivity check:

    ```sh
    npm start
    ```

2. **Configuration**:

   Set these environment variables before starting the application:

    - `MOUSE_SQUARE_SIZE`: Size of the square to draw (default `5`).
    - `MOUSE_MOVEMENT_SPEED`: Delay in milliseconds between mouse positions (default `28`).
    - `MOUSE_CHECK_INTERVAL`: Interval in milliseconds for checking the mouse position (default `15000`).

## Acknowledgments

This project utilizes the following libraries:

- **[@nut-tree-fork/nut-js](https://github.com/nut-tree/nut.js)**: Provides cross-platform mouse control and automation.
- **[kleur](https://github.com/lukeed/kleur)**: Enhances console output with color.

Connectivity is checked with the built-in `fetch` API; no separate ping library is used.

## Disclaimer

This project is intended for educational and testing purposes only. The application moves the mouse and is not intended
for production use. Use it at your own risk.

## License

MIT &copy; [blckclov3r](https://github.com/blckclov3r/mouse-move?tab=MIT-1-ov-file)
