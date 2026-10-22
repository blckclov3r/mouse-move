import {CONNECTIVITY_URLS, MOUSE_CHECK_INTERVAL, MOUSE_MOVEMENT_SPEED, SMALL_SQUARE} from "./const";
import {createDisplay} from "./display";
import {createPointer} from "./pointer";
import {createProbe} from "./probe";
import {createSession} from "./session";

const display = createDisplay();
const session = createSession(
    {
        size: SMALL_SQUARE,
        connectivityUrls: [...CONNECTIVITY_URLS],
        mouseMovementSpeed: MOUSE_MOVEMENT_SPEED,
        mouseCheckInterval: MOUSE_CHECK_INTERVAL,
    },
    {
        pointer: createPointer(),
        probe: createProbe(),
        display,
    },
);

const shutdown = () => {
    session.stop();
    process.exit(0);
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

session.start().catch(error => console.error(`Error starting movement: ${error}`));
