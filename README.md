# Mouse Move

This application demonstrates mouse control and logging using TypeScript. It moves the mouse to draw a square at the
current position every minute and performs network ping checks. This application is intended solely for testing and
educational purposes.

## Features

- **Mouse Control**: Moves the mouse and draws a square on the screen every minute.
- **Network Monitoring**: Performs periodic network ping checks.

## Prerequisites

- **Node.js**: Ensure Node.js is installed (v18 or newer is recommended).
- **TypeScript**: The project uses TypeScript for type safety.

## Installation

1. **Clone the repository**:

    ```sh
    git clone https://github.com/blckclov3r/mouse-move.git
    cd mouse-move
    ```

2. **Install dependencies**:

    ```sh
    npm install
    ```

## Scripts

- **`npm start`**: Builds the TypeScript files and runs the application.
- **`npm run build`**: Compiles TypeScript files into JavaScript.
- **`npm run pkg`**: Packages the application for different platforms (Linux, macOS, Windows).

## Executables

Pre-built executable files are available for different platforms:

- **[Linux](https://raw.githubusercontent.com/blckclov3r/mouse-move/master/app-linux)**
- **[macOS](https://raw.githubusercontent.com/blckclov3r/mouse-move/master/app-macos)**
- **[Windows](https://raw.githubusercontent.com/blckclov3r/mouse-move/master/app-win.exe)**

These files allow you to run the application directly on your platform without needing to build it yourself.

## Usage

1. **Start the application**:

   Execute the following command to start the application. It will draw a square every minute when the mouse is idle and
   perform periodic network pings:

    ```sh
    npm start
    ```

2. **Configuration**:

   Adjust the application’s behavior by modifying the `startMovement` arguments in the `index.ts` file:

    - `size`: Size of the square to draw.
    - `pingUrl`: List of URLs to ping.
    - `mouseMovementSpeed`: Speed of the mouse movement when drawing the square.
    - `mouseCheckInterval`: Interval (in milliseconds) for checking the mouse position.

## Acknowledgments

This project utilizes the following libraries:

- **[@nut-tree-fork/nut-js](https://github.com/nut-tree/nut.js)**: Provides cross-platform mouse control and automation.
- **[kleur](https://github.com/lukeed/kleur)**: Enhances console output with color.
- **[ping](https://github.com/danielzzz/node-ping)**: Manages network ping operations for connectivity checks.

## Disclaimer

This project is intended for educational and testing purposes only. The application draws a square every minute and is
not intended for production use. Use it at your own risk.

## License

MIT &copy; [blckclov3r](https://github.com/blckclov3r/mouse-move?tab=MIT-1-ov-file)
