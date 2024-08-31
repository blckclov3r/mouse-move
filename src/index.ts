import {DEFAULT_TEXT, MOUSE_CHECK_INTERVAL, MOUSE_MOVEMENT_SPEED, PING_URL, SMALL_SQUARE,} from './const';
import utils from "./utils";
import {StartMovementProps} from "./types";
import {mouse} from "@nut-tree-fork/nut-js";

const startMovement = async (props: StartMovementProps) => {
    const {
        formatTime,
        formatDate,
        getUniqueColor,
        drawSquare,
        getUrlPing,
        logError,
    } = utils();

    const startTime = formatTime(new Date());
    const startDate = formatDate(new Date());
    let previousMouseX = 0;
    let previousMouseY = 0;
    let isStarted = false;

    // Initialize mouse position
    const initializePosition = async () => {
        try {
            const position = await mouse.getPosition();
            previousMouseX = position.x;
            previousMouseY = position.y;
        } catch (error) {
            logError(`Error initializing mouse position: ${error}`);
        }
    };

    await initializePosition();

    // Check mouse position and perform actions if idle
    const checkMousePosition = async () => {
        try {
            const position = await mouse.getPosition();
            if (previousMouseX === position.x && previousMouseY === position.y && isStarted) {
                // If no movement detected, reset idle timer
                await drawSquare({
                    size: props.size,
                    mouseMovementSpeed: props.mouseMovementSpeed,
                });
                await getUrlPing(props.pingUrl);
            } else {
                // Update the previous position
                isStarted = true;
                await initializePosition();
            }
        } catch (error) {
            console.error(`Error checking mouse position: ${error}`);
        }
    };

    // Set interval for checking mouse position
    setInterval(checkMousePosition, props.mouseCheckInterval);

    // Log start information
    console.log(getUniqueColor()(DEFAULT_TEXT));
    console.log(getUniqueColor()(`\nStart Date: ${startDate}`));
    console.log(getUniqueColor()(`Start Time: ${startTime}`));
    await getUrlPing(props.pingUrl);
};

// Initiate the movement and logging
startMovement({
    size: SMALL_SQUARE,
    pingUrl: PING_URL,
    mouseMovementSpeed: MOUSE_MOVEMENT_SPEED,
    mouseCheckInterval: MOUSE_CHECK_INTERVAL,
}).catch(error => console.error(`Error starting movement: ${error}`));