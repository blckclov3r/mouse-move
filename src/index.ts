import {DEFAULT_TEXT, MOUSE_CHECK_INTERVAL, MOUSE_MOVEMENT_SPEED, PING_URL, SMALL_SQUARE} from './const';
import utils from "./utils";
import {StartMovementProps} from "./types";
import {mouse} from "@nut-tree-fork/nut-js";

const startMovement = async (props: StartMovementProps) => {
    const {
        formatTime,
        formatDate,
        getRandomColor,
        drawSquare,
        getUrlPing,
        logError,
    } = utils();

    const startTime = formatTime(new Date());
    const startDate = formatDate(new Date());

    let previousMouseX = 0;
    let previousMouseY = 0;
    let isStarted = false;
    let intervalId: NodeJS.Timeout | null = null;
    let isProcessing = false;
    let lastPingSuccess = true;

    const cleanup = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        // Remove listeners so they don't pile up
        process.removeListener("SIGINT", shutdown);
        process.removeListener("SIGTERM", shutdown);
    };

    const shutdown = () => {
        console.log(getRandomColor()("\n🛑 Received shutdown signal. Exiting gracefully..."));
        cleanup();
        process.exit(0);
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);

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
        if (isProcessing) return;
        isProcessing = true;

        try {
            const position = await mouse.getPosition();
            if (
                previousMouseX === position.x &&
                previousMouseY === position.y &&
                isStarted
            ) {
                console.log(
                    getRandomColor()(
                        `\n🔁 Idle for ${props.mouseCheckInterval / 1000}s – moving mouse...`
                    )
                );

                const drawPromise = drawSquare({
                    size: props.size,
                    mouseMovementSpeed: props.mouseMovementSpeed,
                    startPosition: position,
                });
                const pingPromise = new Promise<void>((resolve, _) => {
                    getUrlPing(props.pingUrl, (isAlive: boolean) => {
                        if (isAlive !== lastPingSuccess) {
                            lastPingSuccess = isAlive;
                            if (isAlive) {
                                console.log(getRandomColor()(`✅ Connection restored`));
                            } else {
                                logError(`❌ Connection lost`);
                            }
                        }
                        resolve();
                    });
                });

                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Operation timed out")), 10000)
                );

                await Promise.race([drawPromise, pingPromise, timeout]);
            } else {
                if (!isStarted) {
                    console.log(getRandomColor()(`🖱️ Mouse moved – idle detection activated`));
                }
                isStarted = true;
                previousMouseX = position.x;
                previousMouseY = position.y;
            }
        } catch (error) {
            logError(`Error checking mouse position: ${error}`);
        } finally {
            isProcessing = false;
        }
    };

    intervalId = setInterval(checkMousePosition, props.mouseCheckInterval);


    console.log(getRandomColor()(DEFAULT_TEXT));
    console.log(getRandomColor()(`Start Date: ${startDate}`));
    console.log(getRandomColor()(`Start Time: ${startTime}`));
    console.log(getRandomColor()(`linkedIn: @blckclov3r`));
    console.log(getRandomColor()(`github: @blckclov3r`));

    await getUrlPing(props.pingUrl, (isAlive) => {
        lastPingSuccess = isAlive;
    });
};

startMovement({
    size: SMALL_SQUARE,
    pingUrl: [...PING_URL],
    mouseMovementSpeed: MOUSE_MOVEMENT_SPEED,
    mouseCheckInterval: MOUSE_CHECK_INTERVAL,
}).catch(error => console.error(`Error starting movement: ${error}`));