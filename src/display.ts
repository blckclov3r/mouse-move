import * as kleur from "kleur";
import {CONSOLE_COLOR, DEFAULT_TEXT} from "./const";
import type {Display} from "./session";

const loggerState = {
    isInteractive: Boolean(process.stdout.isTTY && process.env.CI === undefined),
    lastStatus: "",
    lastRenderAt: 0,
};

const formatTimestamp = () =>
    new Date().toLocaleTimeString("en-GB", {hour12: false});

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

export const createDisplay = (): Display => ({
    banner: (startedAt) => {
        const startTime = formatTime(startedAt);
        const startDate = formatDate(startedAt);

        console.log(getRandomColor()(DEFAULT_TEXT));
        console.log(getRandomColor()(`Start Date: ${startDate}`));
        console.log(getRandomColor()(`Start Time: ${startTime}`));
        console.log(getRandomColor()(`linkedIn: @blckclov3r`));
        console.log(getRandomColor()(`github: @blckclov3r`));
    },
    condition: (message) => renderStatus(`${message}\n`),
    event: (message) => logEvent(message),
    error: (message) => logError(message),
    shutdown: () => {
        console.log(getRandomColor()("\n🛑 Received shutdown signal. Exiting gracefully..."));
    },
    clear: () => clearStatus(),
});
