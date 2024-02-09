export const LOG_LEVEL = process.env.NEXT_PUBLIC_AXIOM_LOG_LEVEL || 'debug';

export enum LogLevel {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3,
  fatal = 4,
  off = 100,
}
