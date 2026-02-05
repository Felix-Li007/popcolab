import pino from "pino";
export const logger = pino({
    level: process.env.LOG_LEVEL || "info",
});

export function withLogging<T extends (...args: any[]) => any>(
    name: string,
    fn: T
): T {
    return (async (...args: any[]) => {
        logger.info({ args }, `${name} started`);
        try {
            const result = await fn(...args);
            logger.info({ result }, `${name} exited`);
            return result;
        } catch (error) {
            logger.error({ error }, `${name} errored`);
            throw error;
        }
    }) as T;
}