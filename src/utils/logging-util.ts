import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Writable } from 'node:stream';
import pino from 'pino';

type LogLevelName = 'debug' | 'info' | 'warn' | 'error';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILES: Record<LogLevelName, string> = {
  debug: path.join(LOG_DIR, 'debug.log'),
  info: path.join(LOG_DIR, 'info.log'),
  warn: path.join(LOG_DIR, 'warn.log'),
  error: path.join(LOG_DIR, 'error.log'),
};

function ensureLogDirectory() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (error) {
    // Ignore if the directory already exists; rethrow other filesystem errors.
    if (
      !(error instanceof Error) ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).code !== 'EEXIST'
    ) {
      throw error;
    }
  }
}

function resolveLogLevelName(level: number): LogLevelName {
  if (level >= 50) return 'error';
  if (level >= 40) return 'warn';
  if (level >= 30) return 'info';
  return 'debug';
}

class LevelFileRouter extends Writable {
  private buffer = '';

  private readonly streams: Record<LogLevelName, fs.WriteStream>;

  constructor() {
    super();
    ensureLogDirectory();
    this.streams = {
      debug: fs.createWriteStream(LOG_FILES.debug, { flags: 'a' }),
      info: fs.createWriteStream(LOG_FILES.info, { flags: 'a' }),
      warn: fs.createWriteStream(LOG_FILES.warn, { flags: 'a' }),
      error: fs.createWriteStream(LOG_FILES.error, { flags: 'a' }),
    };
  }

  _write(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ) {
    this.buffer += chunk.toString();

    try {
      let newlineIndex = this.buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const line = this.buffer.slice(0, newlineIndex).trim();
        this.buffer = this.buffer.slice(newlineIndex + 1);
        if (line) {
          this.routeLine(line);
        }
        newlineIndex = this.buffer.indexOf('\n');
      }

      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private routeLine(line: string) {
    try {
      const record = JSON.parse(line) as { level?: number };
      const levelName = resolveLogLevelName(record.level ?? 30);
      const logFile = path.basename(LOG_FILES[levelName]);
      const enrichedLine = JSON.stringify({ ...record, logFile });
      this.streams[levelName].write(`${enrichedLine}\n\n`);

      if (process.env.NODE_ENV !== 'production') {
        process.stdout.write(`${enrichedLine}\n\n`);
      }
    } catch {
      const logFile = path.basename(LOG_FILES.error);
      const enrichedLine = JSON.stringify({ logFile, rawLine: line });
      this.streams.error.write(`${enrichedLine}\n\n`);
      if (process.env.NODE_ENV !== 'production') {
        process.stdout.write(`${enrichedLine}\n\n`);
      }
    }
  }
}

type LoggerGlobal = typeof globalThis & {
  __popcolabLogger?: pino.Logger;
  __popcolabLogStream?: LevelFileRouter;
};

function resolveDefaultLogLevel() {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  if (process.env.NODE_ENV === 'production') return 'error';
  if (process.env.NODE_ENV === 'test') return 'silent';
  return 'debug';
}

function createLogger() {
  const globalForLogging = globalThis as LoggerGlobal;

  if (!globalForLogging.__popcolabLogStream) {
    globalForLogging.__popcolabLogStream = new LevelFileRouter();
  }

  if (!globalForLogging.__popcolabLogger) {
    globalForLogging.__popcolabLogger = pino(
      {
        level: resolveDefaultLogLevel(),
      },
      globalForLogging.__popcolabLogStream
    );
  }

  return globalForLogging.__popcolabLogger;
}

export const logger = createLogger();

export function createModuleLogger(sourceUrl: string) {
  const sourceFile = path.basename(fileURLToPath(sourceUrl));
  return logger.child({ sourceFile });
}

export function withLogging<T extends (...args: unknown[]) => unknown>(
  name: string,
  fn: T
): T {
  return (async (...args: unknown[]) => {
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
