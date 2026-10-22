import {mouse, Point} from "@nut-tree-fork/nut-js";
import type {Pointer} from "./session";

export const createPointer = (): Pointer => ({
    getPosition: async () => {
        const position = await mouse.getPosition();
        return {x: position.x, y: position.y};
    },
    setPosition: async (position) => {
        await mouse.setPosition(new Point(position.x, position.y));
    },
});
