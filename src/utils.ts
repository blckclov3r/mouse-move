import {CONSOLE_COLOR} from "./const";
import * as kleur from "kleur"; // ← fixed import
import {mouse, Point} from "@nut-tree-fork/nut-js";
import {DrawSquareProps} from "./types";

const utils = () => {
    const logError = (message: string): void => {
        console.error(kleur.red(message));
    };

    const getMousePosition = async (): Promise<Point> => {
        try {
            return await mouse.getPosition();
        } catch (error) {
            logError(`Error retrieving mouse position: ${error}`);
            throw new Error('Failed to get mouse position');
        }
    };

    // drawSquare with optional AbortSignal (allows clean cancellation)
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
                if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
                await mouse.setPosition(point);
                await new Promise<void>((resolve, reject) => {
                    const timer = setTimeout(resolve, props.mouseMovementSpeed);
                    signal?.addEventListener('abort', () => {
                        clearTimeout(timer);
                        reject(new DOMException('Aborted', 'AbortError'));
                    }, {once: true});
                });
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            logError(`Error drawing square: ${error}`);
        }
    };

    // Pure helpers
    const formatTime = (date: Date): string => {
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const meridian = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        return `${formattedHours}:${minutes}:${seconds} ${meridian}`;
    };

    const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    };

    const getRandomColor = () =>
        CONSOLE_COLOR[Math.floor(Math.random() * CONSOLE_COLOR.length)];

    // ------------------------------------------------------------
    //  Ping with retry – tries up to 3 random URLs before failing
    // ------------------------------------------------------------
    const getUrlPing = async (
        urls: readonly string[],
        onStatusChange?: (isAlive: boolean) => void,
    ): Promise<boolean> => {
        const maxAttempts = 3;
        const timeoutMs = 5000;

        for (let i = 0; i < maxAttempts; i++) {
            const randomUrl = urls[Math.floor(Math.random() * urls.length)];
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch(`https://${randomUrl}`, {
                    method: 'GET',          // GET is more widely allowed than HEAD
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                if (response.ok) {
                    onStatusChange?.(true);
                    return true;
                }
            } catch {
                // silently try next URL
            } finally {
                clearTimeout(timeoutId);
            }
        }

        // All attempts failed
        onStatusChange?.(false);
        return false;
    };

    return {
        drawSquare,
        formatTime,
        formatDate,
        getRandomColor,
        getUrlPing,
        logError,
    };
};

export default utils;