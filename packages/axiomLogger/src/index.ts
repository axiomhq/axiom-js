import { LogEvent, LogLevel, LoggerConfig } from './interface';
import { throttle } from './throttle';

// sync package version
const Version = "1.0.0-rc.1";

function buildLogsEndpoint() {
  const axiomUrl = 'https://api.axiom.co';
  const dataset = process.env.AXIOM_DATASET;
  return `${axiomUrl}/api/v1/datasets/${dataset}/ingest`;
}

function injectPlatformMetadata(logEvent: LogEvent, source: string) {
  logEvent.platform = {
    environment: process.env.NODE_ENV,
    region: process.env.REGION || undefined,
    source: source + '-log',
  };
}

const AXIOM_URL = 'https://api.axiom.co';
const LOG_LEVEL = process.env.AXIOM_LOG_LEVEL || 'debug';

const isBrowser = typeof window !== 'undefined';
const isVercel = process.env.NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT || process.env.AXIOM_INGEST_ENDPOINT;
const isNoPrettyPrint = process.env.AXIOM_NO_PRETTY_PRINT == 'true' ? true : false;

function isEnvVarsSet(token: string | undefined, dataset: string | undefined): boolean {
    console.log({ dataset, token })
      return !!(AXIOM_URL && dataset && token);
}    

export class AxiomLogger {
  public logEvents: LogEvent[] = [];
  throttledSendLogs = throttle(this.sendLogs, 1000);
  children: AxiomLogger[] = [];
  public logLevel: LogLevel = LogLevel.debug;
  public config: LoggerConfig;

  private url = buildLogsEndpoint()

  constructor(public initConfig: LoggerConfig) {
    if (this.initConfig.logLevel != undefined && this.initConfig.logLevel >= 0) {
      this.logLevel = this.initConfig.logLevel;
    } else if (LOG_LEVEL) {
      this.logLevel = LogLevel[LOG_LEVEL as keyof typeof LogLevel];
    }
    this.config = { ...initConfig };
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

    injectPlatformMetadata(logEvent, this.config.source!);

    if (this.config.req != null) {
      logEvent.request = this.config.req;
      if (logEvent.platform) {
        logEvent.platform.route = this.config.req.path;
      } else if (logEvent.vercel) {
        logEvent.vercel.route = this.config.req.path;
      }
    }

    this.logEvents.push(logEvent);
    if (this.config.autoFlush) {
      this.throttledSendLogs();
    }
  };

  attachResponseStatus = (statusCode: number) => {
    this.logEvents = this.logEvents.map((log) => {
      if (log.request) {
        log.request.statusCode = statusCode;
      }
      return log;
    });
  };

  async sendLogs() {
    if (!this.logEvents.length) {
      return;
    }

    const isAxiomEnvVarsSet = isEnvVarsSet(this.config.token, this.config.dataset)
   console.log({  isAxiomEnvVarsSet })
    if (!isAxiomEnvVarsSet) {
      // if AXIOM ingesting url is not set, fallback to printing to console
      // to avoid network errors in development environments
      this.logEvents.forEach((ev) => prettyPrint(ev));
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
    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }
    const reqOptions: RequestInit = { body, method, keepalive, headers };
    function sendFallback() {
      // Do not leak network errors; does not affect the running app
       const url = buildLogsEndpoint()
      return fetch(url, reqOptions).catch(console.error);
    }

    try {
      if (typeof fetch === 'undefined') {
        const fetch = await require('whatwg-fetch');
        return fetch(this.url, reqOptions).catch(console.error);
      } else if (isBrowser && isVercel && navigator.sendBeacon) {
        // sendBeacon fails if message size is greater than 64kb, so
        // we fall back to fetch.
        if (!navigator.sendBeacon(this.url, body)) {
          return sendFallback();
        }
      } else {
        return sendFallback();
      }
    } catch (e) {
      console.warn(`Failed to send logs to Axiom: ${e}`);
      // put the log events back in the queue
      this.logEvents = [...this.logEvents, JSON.parse(body)];
    }
  }

  flush: any = async () => {
    return Promise.all([this.sendLogs(), ...this.children.map((c) => c.flush())]);
  };
 }


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


function prettyPrint(ev: LogEvent) {
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
  
    if (isBrowser) {
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
  
    if (ev.request) {
      msgString += ' %o';
      args.push(ev.request);
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
