import * as kleur from 'kleur';

// ----- ASCII Art Banner -----
export const DEFAULT_TEXT = `
░█████╗░░█████╗░████████╗██╗██╗░░░██╗░█████╗░████████╗███████╗
██╔══██╗██╔══██╗╚══██╔══╝██║██║░░░██║██╔══██╗╚══██╔══╝██╔════╝
███████║██║░░╚═╝░░░██║░░░██║╚██╗░██╔╝███████║░░░██║░░░█████╗░░
██╔══██║██║░░██╗░░░██║░░░██║░╚████╔╝░██╔══██║░░░██║░░░██╔══╝░░
██║░░██║╚█████╔╝░░░██║░░░██║░░╚██╔╝░░██║░░██║░░░██║░░░███████╗
╚═╝░░╚═╝░╚════╝░░░░╚═╝░░░╚═╝░░░╚═╝░░░╚═╝░░╚═╝░░░╚═╝░░░╚══════╝
`.trimStart();

// ----- Environment Helpers (with simple cache) -----
const envIntCache = new Map<string, number>();
function getIntEnv(key: string, defaultValue: number): number {
    if (envIntCache.has(key)) return envIntCache.get(key)!;
    const raw = process.env[key];
    const parsed = raw === undefined ? NaN : parseInt(raw, 10);
    const value = isNaN(parsed) ? defaultValue : parsed;
    envIntCache.set(key, value);
    return value;
}

export const SMALL_SQUARE = getIntEnv('MOUSE_SQUARE_SIZE', 5);
export const MOUSE_MOVEMENT_SPEED = getIntEnv('MOUSE_MOVEMENT_SPEED', 28);
export const MOUSE_CHECK_INTERVAL = getIntEnv('MOUSE_CHECK_INTERVAL', 15000);

// ----- Color Palette (immutable) -----
export const CONSOLE_COLOR = Object.freeze([
    kleur.grey,
    kleur.green,
    kleur.yellow,
    kleur.blue,
    kleur.cyan,
    kleur.magenta,
]);

// ----- Ping URLs (immutable + helper) -----
export const PING_URL = Object.freeze([
    'microsoft.com',
    'google.com',
    'bing.com',
    'stackoverflow.com',
    'yahoo.com',
    'wikipedia.org',
    'mozilla.org',
    'outlook.com',
    'office.com',
    'azure.com',
]);

export const getRandomPingUrl = (): string =>
    PING_URL[Math.floor(Math.random() * PING_URL.length)];