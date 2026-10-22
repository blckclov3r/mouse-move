# Glossary

- **Session** — one run of idle monitoring: initialize, poll, perform idle operations, stop.
- **Idle sample** — a pointer position read. Two equal consecutive samples after the first active sample mean the pointer is idle.
- **Idle operation** — the work triggered by an idle sample: draw the square and run a connectivity probe, capped by a timeout (10s default).
- **Connectivity probe** — one check of the configured URLs, with retries and a per-attempt timeout, producing a connectivity verdict.
- **Condition** — the transient current state shown on the status line, such as "Monitoring mouse activity" or "Connection lost".
- **Event** — a notable message, such as "Connection restored"; it is a forced status update on a TTY and an INFO line otherwise.
- **Pointer** — the adapter for reading and setting the cursor position.
- **Display** — the adapter for the banner, conditions, events, errors, and shutdown output.
