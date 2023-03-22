export const DEFAULT_LOG_LEVEL = process.env.AXIOM_LOG_LEVEL || 'debug';

export enum LogLevel {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3,
  off = 100,
}

export function resolveLogLevelFromString(l: string): LogLevel {
  switch (l) {
    case 'off':
      return LogLevel.off;
    case 'info':
      return LogLevel.info;
    case 'warn':
      return LogLevel.warn;
    case 'error':
      return LogLevel.error;
    default:
      return LogLevel.debug;
  }
}
