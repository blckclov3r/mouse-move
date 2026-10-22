import {test} from "node:test";
import assert from "node:assert/strict";
import {createProbe} from "./probe";

test("probe returns false for an empty URL list", async () => {
    assert.equal(await createProbe().check([], new AbortController().signal), false);
});

test("probe aborts an in-flight request when the caller aborts", async () => {
    const controller = new AbortController();
    let requestSignal: AbortSignal | undefined;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (
        _input: Parameters<typeof fetch>[0],
        init?: Parameters<typeof fetch>[1],
    ) => {
        requestSignal = init?.signal ?? undefined;
        return new Promise<never>((_resolve, reject) => {
            requestSignal?.addEventListener(
                "abort",
                () => reject(new DOMException("Aborted", "AbortError")),
                {once: true},
            );
        });
    }) as typeof fetch;

    try {
        const result = createProbe().check(["example.com"], controller.signal);
        controller.abort();

        assert.equal(await result, false);
        assert.equal(requestSignal?.aborted, true);
    } finally {
        globalThis.fetch = originalFetch;
    }
});
