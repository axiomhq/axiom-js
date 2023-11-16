import { Axiom } from "./client";
import { LogEvent, LogLevel, LoggerConfig } from "./type";
import { jsonFriendlyErrorReplacer, prettyPrint, throttle } from "./utils";

class Logger {
    public dataset: string;
    public client: Axiom;
    private logLevel: LogLevel;
    private LOG_LEVEL = process.env.AXIOM_LOG_LEVEL || 'debug';
    public logEvents: LogEvent[] = [];
    children: Axiom[] = [];
    throttledSendLogs = throttle(this.sendLogs.bind(this), 1000);

    constructor(public config: LoggerConfig) {
        this.client = config.client;
        this.dataset = config.dataset;
        this.logLevel = this.calculateLogLevel(config.logLevel);
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

    private _log = (level: LogLevel, message: string, args: { [key: string]: any } = {}) => {
        if (level < this.logLevel) {
            return;
        }
        const logEvent: LogEvent = {
            level: LogLevel[level].toString(),
            message,
            _time: new Date(Date.now()).toISOString(),
            fields: this.config.args || {},
        };
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

    private sendLogs() {
        console.log("sending logs")
        if (!this.logEvents.length) {
            return;
        }
        const dataset = this.config.dataset;

        if (!dataset) {
            this.logEvents.forEach((ev) => prettyPrint(ev));
            this.logEvents = [];
            return;
        }
        const currentLogs = this.logEvents;
        this.logEvents = [];

        try {
            this.client.ingest(dataset, currentLogs);
        } catch (error) {
            console.error("Error while ingesting logs:", error);
        }
        currentLogs.forEach((log) => prettyPrint(log));
    }

    async flush() {
        await Promise.all([this.sendLogs(), ...this.children.map((c) => c.flush())]);
    }

    private calculateLogLevel(configLogLevel?: number): LogLevel {
        if (configLogLevel !== undefined && configLogLevel >= 0) {
            return configLogLevel;
        } else if (this.LOG_LEVEL) {
            return LogLevel[this.LOG_LEVEL as keyof typeof LogLevel];
        }
        return LogLevel.debug;
    }
}

export { Logger }