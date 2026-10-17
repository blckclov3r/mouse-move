import {CONSOLE_COLOR} from "./const";
import * as kleur from "kleur";
import {mouse, Point} from "@nut-tree-fork/nut-js";
import {DrawSquareProps} from "./types";

const loggerState = {
    isInteractive: Boolean(process.stdout.isTTY && process.env.CI === undefined),
    lastStatus: "",
    lastRenderAt: 0,
};

const formatTimestamp = () =>
    new Date().toLocaleTimeString("en-GB", {hour12: false});

const renderStatus = (message: string, force = false): void => {
    if (!loggerState.isInteractive) return;

    const normalized = String(message).slice(0, 100) || "waiting";
    const now = Date.now();
    const shouldRender = force || normalized !== loggerState.lastStatus || now - loggerState.lastRenderAt >= 1000;

    if (!shouldRender) return;

    loggerState.lastStatus = normalized;
    loggerState.lastRenderAt = now;
    process.stdout.write(`\r\x1b[2K${kleur.cyan("mouse-move")} ${kleur.dim(formatTimestamp())} ${normalized}`);
};

const clearStatus = (): void => {
    if (!loggerState.isInteractive) return;
    loggerState.lastStatus = "";
    loggerState.lastRenderAt = 0;
    process.stdout.write("\r\x1b[2K");
};

const logError = (message: string): void => {
    if (loggerState.isInteractive) {
        renderStatus(`ERROR ${message}`, true);
        return;
    }

    console.error(`${kleur.red("ERROR")} ${kleur.dim(formatTimestamp())} ${message}`);
};

const logEvent = (message: string): void => {
    if (loggerState.isInteractive) {
        renderStatus(message, true);
        return;
    }

    console.log(`${kleur.green("INFO")} ${kleur.dim(formatTimestamp())} ${message}`);
};

const setStatus = (message: string): void => {
    renderStatus(message);
};

const utils = () => {
    const getMousePosition = async (): Promise<Point> => {
        try {
            return await mouse.getPosition();
        } catch (error) {
            logError(`Error retrieving mouse position: ${error}`);
            throw new Error("Failed to get mouse position");
        }
    };

    const drawSquare = async (
        props: DrawSquareProps,
        signal?: AbortSignal
    ): Promise<void> => {
        try {
            const {x: startX, y: startY} = await getMousePosition();
            const points: Point[] = [
                new Point(startX, startY),
                new Point(startX + props.size, startY),
                new Point(startX + props.size, startY + props.size),
                new Point(startX, startY + props.size),
                new Point(startX, startY),
            ];

            for (const point of points) {
                if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
                await mouse.setPosition(point);
                await new Promise<void>((resolve, reject) => {
                    const timer = setTimeout(resolve, props.mouseMovementSpeed);
                    signal?.addEventListener("abort", () => {
                        clearTimeout(timer);
                        reject(new DOMException("Aborted", "AbortError"));
                    }, {once: true});
                });
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            logError(`Error drawing square: ${error}`);
        }
    };

    const formatTime = (date: Date): string => {
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        const meridian = hours >= 12 ? "PM" : "AM";
        const formattedHours = hours % 12 || 12;
        return `${formattedHours}:${minutes}:${seconds} ${meridian}`;
    };

    const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    };

    const getRandomColor = () =>
        CONSOLE_COLOR[Math.floor(Math.random() * CONSOLE_COLOR.length)];

    const getUrlPing = async (
        urls: readonly string[],
        onStatusChange?: (isAlive: boolean) => void,
        signal?: AbortSignal,
    ): Promise<boolean> => {
        const maxAttempts = 3;
        const timeoutMs = 5000;

        for (let i = 0; i < maxAttempts; i++) {
            if (signal?.aborted) {
                onStatusChange?.(false);
                return false;
            }

            const randomUrl = urls[Math.floor(Math.random() * urls.length)];
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch(`https://${randomUrl}`, {
                    method: "GET",
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    onStatusChange?.(true);
                    return true;
                }
            } catch {
                if (signal?.aborted) {
                    onStatusChange?.(false);
                    return false;
                }
            } finally {
                clearTimeout(timeoutId);
            }
        }

        onStatusChange?.(false);
        return false;
    };

    return {
        clearStatus,
        drawSquare,
        formatTime,
        formatDate,
        getRandomColor,
        getUrlPing,
        logError,
        logEvent,
        setStatus,
    };
};

export default utils;