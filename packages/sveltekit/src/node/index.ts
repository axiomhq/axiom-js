import { Axiom } from '@axiomhq/js';
import { AxiomLogger, LogLevel } from '../logger';

export class Logger implements AxiomLogger {
  private axiom: Axiom;

  public logEvents: LogEvent[] = [];
  children: Logger[] = [];
  public logLevel: LogLevel = LogLevel.DEBUG;
  public config: LoggerConfig = {
    autoFlush: true,
    runtime: 'node',
    prettyPrint: prettyPrint,
  };

  constructor(public initConfig: LoggerConfig = {}) {
    if (!this.initConfig.url) {
      this.initConfig.url = 'https://api.axiom.co';
    }
    // check if user passed a log level, if not the default init value will be used as is.
    if (this.initConfig.logLevel != undefined && this.initConfig.logLevel >= 0) {
      this.logLevel = this.initConfig.logLevel;
    }
    this.config = { ...this.config, ...initConfig };


    this.axiom = new Axiom({ token: this.config.token!, url: this.config.url!, onError: err => console.error(`Axiom: ${err}`) });
  }

  debug = (message: string, args: { [key: string]: any } = {}) =>
    this.log(LogLevel.DEBUG, message, args);

  info = (message: string, args: { [key: string]: any } = {}) =>
    this.log(LogLevel.INFO, message, args);

  warn = (message: string, args: { [key: string]: any } = {}) =>
    this.log(LogLevel.WARN, message, args);

  error = (message: string, args: { [key: string]: any } = {}) =>
    this.log(LogLevel.ERROR, message, args);


  with = (args: { [key: string]: any }) => {
    const config = { ...this.config, args: { ...this.config.args, ...args } };
    const child = new Logger(config);
    this.children.push(child);
    return child;
  };

  private _transformEvent = (level: LogLevel, message: string, args: { [key: string]: any } = {}) => {
    let logEvent: LogEvent = {
      level: LogLevel[level],
      message: message,
      _time: new Date(Date.now()).toISOString(),
      ...this.config.args,
    };

    // check if passed args is an object, if its not an object, add it to fields.args
    if (args instanceof Error) {
      logEvent = { ...logEvent, message: args.message, stack: args.stack, name: args.name };
    } else if (typeof args === 'object' && args !== null && Object.keys(args).length > 0) {
      const parsedArgs = JSON.parse(JSON.stringify(args, jsonFriendlyErrorReplacer));
      logEvent = { ...logEvent, ...parsedArgs };
    } else if (args && args.length) {
      logEvent = { ...logEvent, ...args };
    }

    logEvent.runtime = this.config.runtime;

    return logEvent;
  };

  log = (level: LogLevel, message: string, args: { [key: string]: any } = {}) => {
    if (level < this.logLevel) {
      return Promise.resolve();
    }
    const logEvent = this._transformEvent(level, message, args);

    this.logEvents.push(logEvent);
    if (this.config.autoFlush) {
      return this.axiom.flush();
    } else {
      return Promise.resolve();
    }
  };

  private isCredentialsSet() {
    return !!this.config.token && !!this.config.dataset;
  }

  async sendLogs() {
    if (!this.logEvents.length) {
      return;
    }

    if (!this.isCredentialsSet()) {
      console.warn('Axiom credentials not set, skipping log ingestion');
      // if AXIOM ingesting url is not set, fallback to printing to console
      // to avoid network errors in development environments
      this.logEvents.forEach((ev) => (this.config.prettyPrint ? this.config.prettyPrint(ev) : prettyPrint(ev)));
      this.logEvents = [];
      return;
    }

    try {
      await this.axiom.ingest(this.config.dataset!, this.logEvents);
      this.logEvents = [];
    } catch (e) {
      console.warn(`Failed to send logs to Axiom: ${e}`);
      // put the log events back in the queue
      this.logEvents = [...this.logEvents];
    }
  }

  flush = async () => {
    await Promise.all([this.sendLogs(), ...this.children.map((c) => c.flush())]);
  };
}

const levelColors: { [key: string]: any } = {
  INFO: {
    terminal: '32',
    browser: 'lightgreen',
  },
  DEBUG: {
    terminal: '36',
    browser: 'lightblue',
  },
  WARN: {
    terminal: '33',
    browser: 'yellow',
  },
  ERROR: {
    terminal: '31',
    browser: 'red',
  },
};

export function prettyPrint(ev: LogEvent) {
  // const hasFields = Object.keys(ev).length > 0;
  // check whether pretty print is disabled
  // TODO: fix
  // if (isNoPrettyPrint) {
  //   let msg = `${ev.severity} - ${ev.body}`;
  //   if (hasFields) {
  //     msg += ' ' + JSON.stringify(ev.attributes);
  //   }
  //   console.log(msg);
  //   return;
  // }
  // print indented message, instead of [object]
  // We use the %o modifier instead of JSON.stringify because stringify will print the
  // object as normal text, it loses all the functionality the browser gives for viewing
  // objects in the console, such as expanding and collapsing the object.
  let msgString = '';
  let args: any[] = [ev.level, ev.message];

  msgString = `\x1b[${levelColors[ev.level].terminal}m%s\x1b[0m - %s`;


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

export interface LogEvent {
  _time: string;
  level: string;
  message: string;
  [key: string]: any;
}

export type LoggerConfig = {
  args?: { [key: string]: any };
  logLevel?: LogLevel;
  autoFlush?: boolean;
  runtime?: 'edge' | 'node' | 'browser' | 'worker';
  token?: string;
  dataset?: string;
  url?: string;
  prettyPrint?: typeof prettyPrint;
};
