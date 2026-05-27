import kleur from 'kleur';

export const DEFAULT_TEXT = "\n" +
    "░█████╗░░█████╗░████████╗██╗██╗░░░██╗░█████╗░████████╗███████╗\n" +
    "██╔══██╗██╔══██╗╚══██╔══╝██║██║░░░██║██╔══██╗╚══██╔══╝██╔════╝\n" +
    "███████║██║░░╚═╝░░░██║░░░██║╚██╗░██╔╝███████║░░░██║░░░█████╗░░\n" +
    "██╔══██║██║░░██╗░░░██║░░░██║░╚████╔╝░██╔══██║░░░██║░░░██╔══╝░░\n" +
    "██║░░██║╚█████╔╝░░░██║░░░██║░░╚██╔╝░░██║░░██║░░░██║░░░███████╗\n" +
    "╚═╝░░╚═╝░╚════╝░░░░╚═╝░░░╚═╝░░░╚═╝░░░╚═╝░░╚═╝░░░╚═╝░░░╚══════╝\n";

function getIntEnv(key: string, defaultValue: number): number {
    const val = parseInt(process.env[key] || '', 10);
    return isNaN(val) ? defaultValue : val;
}
export const SMALL_SQUARE = getIntEnv('MOUSE_SQUARE_SIZE', 5);
export const MOUSE_MOVEMENT_SPEED = getIntEnv('MOUSE_MOVEMENT_SPEED', 28);
export const MOUSE_CHECK_INTERVAL = getIntEnv('MOUSE_CHECK_INTERVAL', 15000);

export const CONSOLE_COLOR = [
    kleur.grey,
    kleur.green,
    kleur.yellow,
    kleur.blue,
    kleur.cyan,
    kleur.magenta,
];

export const PING_URL = ['microsoft.com', 'google.com', 'bing.com', 'stackoverflow.com', 'yahoo.com', 'wikipedia.org', 'mozilla.org', 'outlook.com', 'office.com', 'azure.com'];