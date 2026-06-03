import {CONSOLE_COLOR} from "./const";
import kleur from "kleur";
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

    const drawSquare = async (props: DrawSquareProps, signal?: AbortSignal): Promise<void> => {
        try {
            const {x: startX, y: startY} = await getMousePosition();

            // Build the path only once
            const squarePoints: Point[] = [
                new Point(startX, startY),
                new Point(startX + props.size, startY),
                new Point(startX + props.size, startY + props.size),
                new Point(startX, startY + props.size),
                new Point(startX, startY),
            ];

            for (const point of squarePoints) {
                // Check for cancellation before each move
                if (signal?.aborted) {
                    throw new DOMException('Square drawing aborted', 'AbortError');
                }

                await mouse.setPosition(point);
                await new Promise<void>((resolve, reject) => {
                    const timer = setTimeout(resolve, props.mouseMovementSpeed);
                    // If an abort signal is provided, cancel the delay when aborted
                    signal?.addEventListener('abort', () => {
                        clearTimeout(timer);
                        reject(new DOMException('Delay aborted', 'AbortError'));
                    }, {once: true});
                });
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                // Expected cancellation – silently stop
                return;
            }
            logError(`Error drawing square: ${error}`);
        }
    };

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

    const getRandomColor = (): (text: string) => string => {
        return CONSOLE_COLOR[Math.floor(Math.random() * CONSOLE_COLOR.length)];
    };
    
    const getUrlPing = async (
        urls: string[],
        onStatusChange?: (isAlive: boolean) => void,
    ): Promise<boolean> => {
        const randomUrl = urls[Math.floor(Math.random() * urls.length)];
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch(`https://${randomUrl}`, {
                method: 'HEAD',
                signal: controller.signal,
            });
            const isAlive = response.ok;
            onStatusChange?.(isAlive);
            return isAlive;
        } catch (error) {
            onStatusChange?.(false);
            return false;
        } finally {
            // Always clear the timeout, even on success
            clearTimeout(timeoutId);
            // Explicitly drop the callback reference after call
            onStatusChange = undefined;
        }
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