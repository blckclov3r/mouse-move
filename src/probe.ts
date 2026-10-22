import type {Probe} from "./session";

const MAX_ATTEMPTS = 3;
const ATTEMPT_TIMEOUT_MS = 5_000;

export const createProbe = (): Probe => ({
    check: async (urls, signal) => {
        if (urls.length === 0) return false;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            if (signal.aborted) return false;

            const randomUrl = urls[Math.floor(Math.random() * urls.length)];
            const controller = new AbortController();
            const abortAttempt = () => controller.abort();
            signal.addEventListener("abort", abortAttempt, {once: true});
            const timeoutId = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

            try {
                const response = await fetch(`https://${randomUrl}`, {
                    method: "GET",
                    signal: controller.signal,
                });

                if (response.ok) return true;
            } catch {
                if (signal.aborted) return false;
            } finally {
                clearTimeout(timeoutId);
                signal.removeEventListener("abort", abortAttempt);
            }
        }

        return false;
    },
});
