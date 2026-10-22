export interface Position {
    readonly x: number;
    readonly y: number;
}

export type Condition =
    | "Tracking mouse idle state"
    | "Mouse active, idle detection enabled"
    | "Idle detected, moving mouse"
    | "Monitoring mouse activity"
    | "Checking connectivity"
    | "Network healthy"
    | "Network unavailable"
    | "Connection restored"
    | "Connection lost"
    | "Shutting down";

export type SessionEvent = "Connection restored";

export interface Pointer {
    getPosition(): Promise<Position>;
    setPosition(position: Position): Promise<void>;
}

export interface Probe {
    check(urls: readonly string[], signal: AbortSignal): Promise<boolean>;
}

export interface Display {
    banner(startedAt: Date): void;
    condition(message: Condition): void;
    event(message: SessionEvent): void;
    error(message: string): void;
    shutdown(): void;
    clear(): void;
}

export interface SessionConfig {
    readonly size: number;
    readonly connectivityUrls: readonly string[];
    readonly mouseMovementSpeed: number;
    readonly mouseCheckInterval: number;
    readonly idleOperationTimeoutMs?: number;
}

export interface SessionDeps {
    readonly pointer: Pointer;
    readonly probe: Probe;
    readonly display: Display;
}

export interface Session {
    start(): Promise<void>;
    stop(): void;
}

const DEFAULT_IDLE_OPERATION_TIMEOUT_MS = 10_000;

export const createSession = (config: SessionConfig, deps: SessionDeps): Session => {
    const {pointer, probe, display} = deps;
    const idleOperationTimeoutMs = config.idleOperationTimeoutMs ?? DEFAULT_IDLE_OPERATION_TIMEOUT_MS;

    let previousMouseX = 0;
    let previousMouseY = 0;
    let isStarted = false;
    let isProcessing = false;
    let isStopping = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let lastConnectivity = true;
    let lastStatusMessage: Condition | null = null;
    const shutdownController = new AbortController();

    const status = (message: Condition) => {
        if (message === lastStatusMessage) return;
        lastStatusMessage = message;
        display.condition(message);
    };

    const updateConnectivityState = (isConnected: boolean) => {
        if (isConnected === lastConnectivity) return;

        lastConnectivity = isConnected;
        if (isConnected) {
            status("Connection restored");
            display.event("Connection restored");
        } else {
            status("Connection lost");
            display.error("Connection lost");
        }
    };

    const cleanup = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }

        shutdownController.abort();
        display.clear();
    };

    const drawSquare = async (signal: AbortSignal): Promise<void> => {
        try {
            const {x: startX, y: startY} = await pointer.getPosition();
            const points: Position[] = [
                {x: startX, y: startY},
                {x: startX + config.size, y: startY},
                {x: startX + config.size, y: startY + config.size},
                {x: startX, y: startY + config.size},
                {x: startX, y: startY},
            ];

            for (const point of points) {
                if (signal.aborted) throw new DOMException("Aborted", "AbortError");
                await pointer.setPosition(point);
                await new Promise<void>((resolve, reject) => {
                    const timer = setTimeout(resolve, config.mouseMovementSpeed);
                    signal.addEventListener("abort", () => {
                        clearTimeout(timer);
                        reject(new DOMException("Aborted", "AbortError"));
                    }, {once: true});
                });
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            display.error(`Error drawing square: ${error}`);
        }
    };

    const handleIdleState = async () => {
        status("Idle detected, moving mouse");

        const operationController = new AbortController();
        const abortOperation = () => operationController.abort();
        shutdownController.signal.addEventListener("abort", abortOperation, {once: true});

        const drawTask = drawSquare(operationController.signal);
        const probeTask = probe.check(config.connectivityUrls, operationController.signal)
            .then((isConnected) => {
                if (!isStopping && !operationController.signal.aborted) {
                    updateConnectivityState(isConnected);
                }
            })
            .then(() => undefined);

        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const timeoutTask = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                operationController.abort();
                reject(new Error("Operation timed out"));
            }, idleOperationTimeoutMs);
        });

        try {
            await Promise.race([Promise.all([drawTask, probeTask]), timeoutTask]);
        } catch (error) {
            operationController.abort();
            if (!isStopping) {
                const message = error instanceof Error ? error.message : String(error);
                display.error(`Idle operation failed: ${message}`);
            }
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            shutdownController.signal.removeEventListener("abort", abortOperation);
            if (!isStopping) status("Monitoring mouse activity");
        }
    };

    const checkMousePosition = async () => {
        if (isStopping || isProcessing) return;
        isProcessing = true;

        try {
            const position = await pointer.getPosition();
            const idleDetected = isStarted && previousMouseX === position.x && previousMouseY === position.y;

            if (idleDetected) {
                await handleIdleState();
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
                display.error(`Error checking mouse position: ${error}`);
            }
        } finally {
            if (!isStopping) {
                isProcessing = false;
            }
        }
    };

    const initializePosition = async () => {
        try {
            if (isStopping) return;
            const position = await pointer.getPosition();
            previousMouseX = position.x;
            previousMouseY = position.y;
            status("Tracking mouse idle state");
        } catch (error) {
            display.error(`Error initializing mouse position: ${error}`);
        }
    };

    const start = async () => {
        const startedAt = new Date();
        await initializePosition();
        intervalId = setInterval(checkMousePosition, config.mouseCheckInterval);

        display.banner(startedAt);
        status("Checking connectivity");

        const isConnected = await probe.check(config.connectivityUrls, shutdownController.signal);
        lastConnectivity = isConnected;
        status(isConnected ? "Network healthy" : "Network unavailable");
    };

    const stop = () => {
        if (isStopping) return;

        isStopping = true;
        status("Shutting down");
        display.shutdown();
        cleanup();
    };

    return {start, stop};
};
