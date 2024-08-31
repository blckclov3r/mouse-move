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

    const checkMousePosition = async () => {
        try {
            const position = await mouse.getPosition();
            if (previousMouseX === position.x && previousMouseY === position.y && isStarted) {
                await drawSquare({
                    size: props.size,
                    mouseMovementSpeed: props.mouseMovementSpeed,
                });
                await getUrlPing(props.pingUrl);
            } else {
                isStarted = true;
                await initializePosition();
            }
        } catch (error) {
            console.error(`Error checking mouse position: ${error}`);
        }
    };

    setInterval(checkMousePosition, props.mouseCheckInterval);

    console.log(getUniqueColor()(DEFAULT_TEXT));
    console.log(getUniqueColor()(`Start Date: ${startDate}`));
    console.log(getUniqueColor()(`Start Time: ${startTime}`));
    console.log(getUniqueColor()(`linkedIn: @blckclov3r`));
    console.log(getUniqueColor()(`github: @blckclov3r`));

    await getUrlPing(props.pingUrl);
};

startMovement({
    size: SMALL_SQUARE,
    pingUrl: PING_URL,
    mouseMovementSpeed: MOUSE_MOVEMENT_SPEED,
    mouseCheckInterval: MOUSE_CHECK_INTERVAL,
}).catch(error => console.error(`Error starting movement: ${error}`));