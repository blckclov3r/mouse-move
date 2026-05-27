import {Point} from "@nut-tree-fork/nut-js";

export interface DrawSquareProps {
    size: number;
    mouseMovementSpeed: number;
    startPosition: Point;
}

export interface StartMovementProps {
    size: number;
    pingUrl: string[];
    mouseMovementSpeed: number;
    mouseCheckInterval: number;
}