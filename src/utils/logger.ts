/**
 * Centralized logger for the application.
 * Use this instead of console.log directly to allow for easier filtering and production handling.
 */
export const logger = {
    log: (...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(...args);
        }
    },
    warn: (...args: any[]) => {
        console.warn(...args);
    },
    error: (...args: any[]) => {
        console.error(...args);
    },
    info: (...args: any[]) => {
        console.info(...args);
    }
};
