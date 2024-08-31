import {CONSOLE_COLOR, PING_URL} from "./const";
import kleur from "kleur";
import {mouse, Point} from "@nut-tree-fork/nut-js";
import ping from 'ping';
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

    const drawSquare = async (props: DrawSquareProps): Promise<void> => {
        try {
            const {x: startX, y: startY} = await getMousePosition();
            const squarePoints: Point[] = [
                new Point(startX, startY),
                new Point(startX + props.size, startY),
                new Point(startX + props.size, startY + props.size),
                new Point(startX, startY + props.size),
                new Point(startX, startY)
            ];

            for (const point of squarePoints) {
                await mouse.setPosition(point);
                await new Promise(resolve => setTimeout(resolve, props.mouseMovementSpeed)); // Delay between movements
            }
        } catch (error) {
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


    const getUniqueColor = (): (text: string) => string => {
        return CONSOLE_COLOR[Math.floor(Math.random() * CONSOLE_COLOR.length)];
    };

    const getUrlPing = async (ping_url = PING_URL) => {
        const randomUrl = ping_url[Math.floor(Math.random() * ping_url.length)];
        try {
            const result = await ping.promise.probe(randomUrl);
            if (result.alive) {
                console.log(getUniqueColor()(`\nPing to ${randomUrl} successful: ${result.time} ms`));
            } else {
                logError(`\nPing to ${randomUrl} failed.`);
            }
        } catch (error) {
            logError(`Error pinging URL: ${error}`);
        }
    };

    return {
        drawSquare,
        formatTime,
        formatDate,
        getUniqueColor,
        getUrlPing,
        logError,
    };
};

export default utils;