import {mock, test} from "node:test";
import assert from "node:assert/strict";
import {createSession} from "./session";
import type {Condition, Display, Position, Probe, SessionConfig} from "./session";

type Assert<T extends true> = T;
type _ConditionIsClosed = Assert<string extends Condition ? false : true>;

// @ts-expect-error conditions are a closed vocabulary
const _unknownCondition: Condition = "Network maybe";

const config = (overrides: Partial<SessionConfig> = {}): SessionConfig => ({
    size: 5,
    connectivityUrls: ["example.com"],
    mouseMovementSpeed: 0,
    mouseCheckInterval: 15_000,
    ...overrides,
});

type DisplayCall = { method: string; message?: string };

const conditionMessages = (calls: DisplayCall[]): Array<string | undefined> =>
    calls
        .filter((call) => call.method === "condition")
        .map((call) => call.message);

const createFakeDisplay = () => {
    const calls: DisplayCall[] = [];
    const display: Display = {
        banner: () => { calls.push({method: "banner"}); },
        condition: (message) => { calls.push({method: "condition", message}); },
        event: (message) => { calls.push({method: "event", message}); },
        error: (message) => { calls.push({method: "error", message}); },
        shutdown: () => { calls.push({method: "shutdown"}); },
        clear: () => { calls.push({method: "clear"}); },
    };
    return {display, calls};
};

const createFakePointer = (positions: Position[]) => {
    let index = 0;
    const pointer = {
        getPositionCalls: 0,
        setPositionCalls: [] as Position[],
        getPosition: async (): Promise<Position> => {
            pointer.getPositionCalls += 1;
            return positions[Math.min(index++, positions.length - 1)];
        },
        setPosition: async (position: Position): Promise<void> => {
            pointer.setPositionCalls.push(position);
        },
    };
    return pointer;
};

type FakeProbe = Probe & {checkCalls: number; signals: AbortSignal[]};

const createFakeProbe = (verdicts: boolean[]): FakeProbe => {
    let index = 0;
    const probe = {
        checkCalls: 0,
        signals: [] as AbortSignal[],
        check: async (_urls: readonly string[], signal: AbortSignal): Promise<boolean> => {
            probe.checkCalls += 1;
            probe.signals.push(signal);
            return verdicts[Math.min(index++, verdicts.length - 1)];
        },
    };
    return probe;
};

const last = <T>(values: T[]): T | undefined => values[values.length - 1];

const waitFor = async (predicate: () => boolean, timeoutMs = 2000): Promise<void> => {
    const started = Date.now();
    while (!predicate()) {
        if (Date.now() - started > timeoutMs) {
            throw new Error("Timed out waiting for behavior");
        }
        await new Promise((resolve) => setTimeout(resolve, 5));
    }
};

test("start samples the pointer, shows the banner, and reports connectivity", async () => {
    const {display, calls} = createFakeDisplay();
    const pointer = createFakePointer([{x: 10, y: 20}]);
    const probe = createFakeProbe([true]);
    const session = createSession(config(), {pointer, probe, display});

    try {
        await session.start();

        const conditions = conditionMessages(calls);

        assert.equal(pointer.getPositionCalls, 1);
        assert.deepEqual(pointer.setPositionCalls, []);
        assert.ok(calls.some((call) => call.method === "banner"));
        assert.equal(conditions[0], "Tracking mouse idle state");
        assert.ok(conditions.includes("Checking connectivity"));
        assert.equal(last(conditions), "Network healthy");
        assert.equal(probe.checkCalls, 1);
    } finally {
        session.stop();
    }
});

test("two equal idle samples draw the square and check connectivity", async () => {
    mock.timers.enable({apis: ["setInterval"]});
    const {display, calls} = createFakeDisplay();
    const pointer = createFakePointer([
        {x: 10, y: 20},
        {x: 10, y: 20},
        {x: 10, y: 20},
    ]);
    const probe = createFakeProbe([true, true]);
    const session = createSession(config({mouseCheckInterval: 1_000}), {pointer, probe, display});

    try {
        await session.start();

        mock.timers.tick(1_000);
        await waitFor(() => pointer.getPositionCalls === 2);
        mock.timers.tick(1_000);
        await waitFor(() => pointer.setPositionCalls.length === 5);

        assert.deepEqual(pointer.setPositionCalls, [
            {x: 10, y: 20},
            {x: 15, y: 20},
            {x: 15, y: 25},
            {x: 10, y: 25},
            {x: 10, y: 20},
        ]);
        assert.equal(probe.checkCalls, 2);
        await waitFor(() => conditionMessages(calls).includes("Monitoring mouse activity"));

        const conditions = conditionMessages(calls);
        assert.ok(conditions.includes("Idle detected, moving mouse"));
        assert.ok(conditions.includes("Monitoring mouse activity"));
    } finally {
        session.stop();
        mock.timers.reset();
    }
});

test("a moving pointer does not start an idle operation", async () => {
    mock.timers.enable({apis: ["setInterval"]});
    const {display} = createFakeDisplay();
    const pointer = createFakePointer([
        {x: 10, y: 20},
        {x: 11, y: 20},
        {x: 12, y: 20},
    ]);
    const probe = createFakeProbe([true]);
    const session = createSession(config({mouseCheckInterval: 1_000}), {pointer, probe, display});

    try {
        await session.start();

        mock.timers.tick(1_000);
        await waitFor(() => pointer.getPositionCalls === 2);
        mock.timers.tick(1_000);
        await waitFor(() => pointer.getPositionCalls === 3);
        await new Promise((resolve) => setTimeout(resolve, 20));

        assert.deepEqual(pointer.setPositionCalls, []);
        assert.equal(probe.checkCalls, 1);
    } finally {
        session.stop();
        mock.timers.reset();
    }
});

test("stop clears polling, aborts the probe, and shuts down once", async () => {
    mock.timers.enable({apis: ["setInterval"]});
    const {display, calls} = createFakeDisplay();
    const pointer = createFakePointer([{x: 10, y: 20}]);
    const probe = createFakeProbe([true]);
    const session = createSession(config({mouseCheckInterval: 1_000}), {pointer, probe, display});

    try {
        await session.start();
        const positionCallsAtStop = pointer.getPositionCalls;

        session.stop();
        session.stop();

        mock.timers.tick(5_000);
        await new Promise((resolve) => setTimeout(resolve, 20));

        assert.equal(pointer.getPositionCalls, positionCallsAtStop);
        assert.ok(probe.signals.every((signal) => signal.aborted));
        assert.equal(calls.filter((call) => call.method === "shutdown").length, 1);
        assert.ok(calls.some((call) => call.method === "clear"));

        const conditions = conditionMessages(calls);
        assert.ok(conditions.includes("Shutting down"));
    } finally {
        session.stop();
        mock.timers.reset();
    }
});

test("connectivity changes during idle are logged as conditions and events", async () => {
    mock.timers.enable({apis: ["setInterval"]});
    const {display, calls} = createFakeDisplay();
    const pointer = createFakePointer([{x: 10, y: 20}]);
    const probe = createFakeProbe([true, false, true]);
    const session = createSession(config({mouseCheckInterval: 1_000}), {pointer, probe, display});

    const conditions = () => conditionMessages(calls);

    try {
        await session.start();

        mock.timers.tick(1_000);
        await waitFor(() => pointer.getPositionCalls === 2);
        mock.timers.tick(1_000);
        await waitFor(() => probe.checkCalls === 2);
        await waitFor(() => conditions().includes("Monitoring mouse activity"));

        assert.ok(conditions().includes("Connection lost"));
        assert.ok(calls.some((call) => call.method === "error" && call.message === "Connection lost"));

        mock.timers.tick(1_000);
        await waitFor(() => probe.checkCalls === 3);
        await waitFor(() => calls.some((call) => call.method === "event" && call.message === "Connection restored"));

        assert.ok(conditions().includes("Connection restored"));
    } finally {
        session.stop();
        mock.timers.reset();
    }
});

test("an idle operation that exceeds its timeout is aborted and reported", async () => {
    mock.timers.enable({apis: ["setInterval"]});
    const {display, calls} = createFakeDisplay();
    const pointer = createFakePointer([{x: 10, y: 20}, {x: 10, y: 20}]);
    const signals: AbortSignal[] = [];
    let checkCalls = 0;
    const probe: Probe = {
        check: async (_urls, signal) => {
            checkCalls += 1;
            signals.push(signal);
            if (checkCalls === 1) return true;

            return new Promise<boolean>((resolve) => {
                signal.addEventListener("abort", () => resolve(false), {once: true});
            });
        },
    };
    const session = createSession(
        config({mouseCheckInterval: 1_000, idleOperationTimeoutMs: 20}),
        {pointer, probe, display},
    );

    try {
        await session.start();

        mock.timers.tick(1_000);
        await waitFor(() => pointer.getPositionCalls === 2);
        mock.timers.tick(1_000);
        await waitFor(() => checkCalls === 2);
        await waitFor(() => calls.some(
            (call) => call.method === "error" && call.message === "Idle operation failed: Operation timed out",
        ));

        assert.equal(signals.length, 2);
        assert.ok(signals[1].aborted);
        assert.ok(conditionMessages(calls).includes("Monitoring mouse activity"));
    } finally {
        session.stop();
        mock.timers.reset();
    }
});

test("an unavailable initial probe reports the network condition", async () => {
    const {display, calls} = createFakeDisplay();
    const pointer = createFakePointer([{x: 10, y: 20}]);
    const probe = createFakeProbe([false]);
    const session = createSession(config(), {pointer, probe, display});

    try {
        await session.start();

        const conditions = conditionMessages(calls);
        assert.equal(last(conditions), "Network unavailable");
    } finally {
        session.stop();
    }
});
