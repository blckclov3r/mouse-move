import {DEFAULT_TEXT, MOUSE_CHECK_INTERVAL, MOUSE_MOVEMENT_SPEED, PING_URL, SMALL_SQUARE} from './const';
import utils from "./utils";
import {StartMovementProps} from "./types";
import {mouse} from "@nut-tree-fork/nut-js";

const IDLE_OPERATION_TIMEOUT_MS = 10_000;

const startMovement = async (props: StartMovementProps) => {
    const {
        formatTime,
        formatDate,
        getRandomColor,
        drawSquare,
        getUrlPing,
        logError,
        setStatus,
        clearStatus,
        logEvent,
    } = utils();

    const startTime = formatTime(new Date());
    const startDate = formatDate(new Date());

    let previousMouseX = 0;
    let previousMouseY = 0;
    let isStarted = false;
    let isProcessing = false;
    let isStopping = false;
    let intervalId: NodeJS.Timeout | null = null;
    let lastPingSuccess = true;
    let lastStatusMessage = "";
    const shutdownController = new AbortController();

    const status = (message: string) => {
        if (message === lastStatusMessage) return;
        lastStatusMessage = message;
        setStatus(message+`\n`);
    };

    const updatePingState = (isAlive: boolean) => {
        if (isAlive === lastPingSuccess) return;

        lastPingSuccess = isAlive;
        if (isAlive) {
            status("Connection restored");
            logEvent("Connection restored");
        } else {
            status("Connection lost");
            logError("Connection lost");
        }
    };

    const cleanup = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }

        shutdownController.abort();
        clearStatus();
        process.removeListener("SIGINT", shutdown);
        process.removeListener("SIGTERM", shutdown);
    };

    const shutdown = () => {
        if (isStopping) return;

        isStopping = true;
        status("Shutting down");
        console.log(getRandomColor()("\n🛑 Received shutdown signal. Exiting gracefully..."));
        cleanup();
        process.exit(0);
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);

    const initializePosition = async () => {
        try {
            if (isStopping) return;
            const position = await mouse.getPosition();
            previousMouseX = position.x;
            previousMouseY = position.y;
            status("Tracking mouse idle state");
        } catch (error) {
            logError(`Error initializing mouse position: ${error}`);
        }
    };

    const handleIdleState = async (position: { x: number; y: number }) => {
        status("Idle detected, moving mouse");

        const operationController = new AbortController();
        const drawTask = drawSquare({
            size: props.size,
            mouseMovementSpeed: props.mouseMovementSpeed,
            startPosition: position,
        }, operationController.signal);

        const pingTask = getUrlPing(
            props.pingUrl,
            updatePingState,
            shutdownController.signal,
        ).then(() => undefined);

        const timeoutTask = new Promise<never>((_, reject) => {
            const timer = setTimeout(() => {
                operationController.abort();
                reject(new Error("Operation timed out"));
            }, IDLE_OPERATION_TIMEOUT_MS);

            shutdownController.signal.addEventListener("abort", () => clearTimeout(timer), {once: true});
        });

        await Promise.race([drawTask, pingTask, timeoutTask]);
        status("Monitoring mouse activity");
    };

    const checkMousePosition = async () => {
        if (isStopping || isProcessing) return;
        isProcessing = true;

        try {
            const position = await mouse.getPosition();
            const idleDetected = isStarted && previousMouseX === position.x && previousMouseY === position.y;

            if (idleDetected) {
                await handleIdleState(position);
                return;
            }

            if (!isStarted) {
                status("Mouse active, idle detection enabled");
            }

            isStarted = true;
            previousMouseX = position.x;
            previousMouseY = position.y;
        } catch (error) {
            if (!isStopping) {
                logError(`Error checking mouse position: ${error}`);
            }
        } finally {
            if (!isStopping) {
                isProcessing = false;
            }
        }
    };

    await initializePosition();
    intervalId = setInterval(checkMousePosition, props.mouseCheckInterval);

    console.log(getRandomColor()(DEFAULT_TEXT));
    console.log(getRandomColor()(`Start Date: ${startDate}`));
    console.log(getRandomColor()(`Start Time: ${startTime}`));
    console.log(getRandomColor()(`linkedIn: @blckclov3r`));
    console.log(getRandomColor()(`github: @blckclov3r`));

    status("Checking connectivity");
    await getUrlPing(props.pingUrl, (isAlive) => {
        lastPingSuccess = isAlive;
        status(isAlive ? "Network healthy" : "Network unavailable");
    }, shutdownController.signal).catch(() => undefined);
};

startMovement({
    size: SMALL_SQUARE,
    pingUrl: [...PING_URL],
    mouseMovementSpeed: MOUSE_MOVEMENT_SPEED,
    mouseCheckInterval: MOUSE_CHECK_INTERVAL,
}).catch(error => console.error(`Error starting movement: ${error}`));