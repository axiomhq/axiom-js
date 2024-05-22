import { config, Version } from './config';
import { isNoPrettyPrint, throttle } from './shared';
import { currentRuntime, Runtime } from './runtime';

const url = config.getIngestURL();

const LOG_LEVEL = process.env.NEXT_PUBLIC_AXIOM_LOG_LEVEL || 'debug';

export interface LogEvent {
  level: string;
  message: string;
  fields: any;
  _time: string;
}

export enum LogLevel {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3,
  off = 100,
}

export type LoggerConfig = {
  args?: { [key: string]: any };
  logLevel?: LogLevel;
  autoFlush?: boolean;
  source?: string;
  req?: any;
  prettyPrint?: typeof prettyPrint;
};

export class Logger {
  public logEvents: LogEvent[] = [];
  throttledSendLogs = throttle(this.sendLogs, 1000);
  children: Logger[] = [];
  public logLevel: LogLevel = LogLevel.debug;
  public config: LoggerConfig = {
    autoFlush: true,
    source: 'browser',
    prettyPrint: prettyPrint,
  };

  constructor(public initConfig: LoggerConfig = {}) {
    // check if user passed a log level, if not the default init value will be used as is.
    if (this.initConfig.logLevel != undefined && this.initConfig.logLevel >= 0) {
      this.logLevel = this.initConfig.logLevel;
    } else if (LOG_LEVEL) {
      this.logLevel = LogLevel[LOG_LEVEL as keyof typeof LogLevel];
    }
    this.config = { ...this.config, ...initConfig };
  }

  debug = (message: string, args: { [key: string]: any } = {}) => {
    this._log(LogLevel.debug, message, args);
  };
  info = (message: string, args: { [key: string]: any } = {}) => {
    this._log(LogLevel.info, message, args);
  };
  warn = (message: string, args: { [key: string]: any } = {}) => {
    this._log(LogLevel.warn, message, args);
  };
  error = (message: string, args: { [key: string]: any } = {}) => {
    this._log(LogLevel.error, message, args);
  };

  with = (args: { [key: string]: any }) => {
    const config = { ...this.config, args: { ...this.config.args, ...args } };
    const child = new Logger(config);
    this.children.push(child);
    return child;
  };

  withRequest = (req: any) => {
    return new Logger({ ...this.config, req: { ...this.config.req, ...req } });
  };

  _log = (level: LogLevel, message: string, args: { [key: string]: any } = {}) => {
    if (level < this.logLevel) {
      return;
    }
    const logEvent: LogEvent = {
      level: LogLevel[level].toString(),
      message,
      _time: new Date(Date.now()).toISOString(),
      fields: this.config.args || {},
    };

    // check if passed args is an object, if its not an object, add it to fields.args
    if (args instanceof Error) {
      logEvent.fields = { ...logEvent.fields, message: args.message, stack: args.stack, name: args.name };
    } else if (typeof args === 'object' && args !== null && Object.keys(args).length > 0) {
      const parsedArgs = JSON.parse(JSON.stringify(args, jsonFriendlyErrorReplacer));
      logEvent.fields = { ...logEvent.fields, ...parsedArgs };
    } else if (args && args.length) {
      logEvent.fields = { ...logEvent.fields, args: args };
    }

    this.logEvents.push(logEvent);
    if (this.config.autoFlush) {
      this.throttledSendLogs();
    }
  };

  async sendLogs() {
    if (!this.logEvents.length) {
      return;
    }

    if (!config.isEnvVarsSet()) {
      // if AXIOM ingesting url is not set, fallback to printing to console
      // to avoid network errors in development environments
      this.logEvents.forEach((ev) => (this.config.prettyPrint ? this.config.prettyPrint(ev) : prettyPrint(ev)));
      this.logEvents = [];
      return;
    }

    const method = 'POST';
    const keepalive = true;
    const body = JSON.stringify(this.logEvents);
    // clear pending logs
    this.logEvents = [];
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'next-axiom/v' + Version,
    };
    if (config.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
    }
    const reqOptions: RequestInit = { body, method, keepalive, headers };

    function sendFallback() {
      // Do not leak network errors; does not affect the running app
      return fetch(url, reqOptions).catch(console.error);
    }

    try {
      if (typeof fetch === 'undefined') {
        const fetch = await require('whatwg-fetch');
        return fetch(url, reqOptions).catch(console.error);
      } else {
        return sendFallback();
      }
    } catch (e) {
      console.warn(`Failed to send logs to Axiom: ${e}`);
      // put the log events back in the queue
      this.logEvents = [...this.logEvents, JSON.parse(body)];
    }
  }

  flush = async () => {
    await Promise.all([this.sendLogs(), ...this.children.map((c) => c.flush())]);
  };
}

export const log = new Logger({});

const levelColors: { [key: string]: any } = {
  info: {
    terminal: '32',
    browser: 'lightgreen',
  },
  debug: {
    terminal: '36',
    browser: 'lightblue',
  },
  warn: {
    terminal: '33',
    browser: 'yellow',
  },
  error: {
    terminal: '31',
    browser: 'red',
  },
};

export function prettyPrint(ev: LogEvent) {
  const hasFields = Object.keys(ev.fields).length > 0;
  // check whether pretty print is disabled
  if (isNoPrettyPrint) {
    let msg = `${ev.level} - ${ev.message}`;
    if (hasFields) {
      msg += ' ' + JSON.stringify(ev.fields);
    }
    console.log(msg);
    return;
  }
  // print indented message, instead of [object]
  // We use the %o modifier instead of JSON.stringify because stringify will print the
  // object as normal text, it loses all the functionality the browser gives for viewing
  // objects in the console, such as expanding and collapsing the object.
  let msgString = '';
  let args: any[] = [ev.level, ev.message];

  if (currentRuntime == Runtime.Browser) {
    msgString = '%c%s - %s';
    args = [`color: ${levelColors[ev.level].browser};`, ...args];
  } else {
    msgString = `\x1b[${levelColors[ev.level].terminal}m%s\x1b[0m - %s`;
  }
  // we check if the fields object is not empty, otherwise its printed as <empty string>
  // or just "".
  if (hasFields) {
    msgString += ' %o';
    args.push(ev.fields);
  }

  console.log.apply(console, [msgString, ...args]);
}

function jsonFriendlyErrorReplacer(key: string, value: any) {
  if (value instanceof Error) {
    return {
      // Pull all enumerable properties, supporting properties on custom Errors
      ...value,
      // Explicitly pull Error's non-enumerable properties
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
}
