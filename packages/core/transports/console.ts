import { Transport } from '.';
import { LogEvent } from '..';
import { isBrowser } from '../shared';
export interface ConsoleTransportConfig {
  prettyPrint?: boolean;
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

export class ConsoleTransport implements Transport {
  private config: ConsoleTransportConfig;
  constructor(config: ConsoleTransportConfig) {
    this.config = config;
  }
  log: Transport['log'] = (logs) => {
    logs.forEach((log) => {
      console.log(log);
    });
  };

  prettyPrint(ev: LogEvent) {
    const hasFields = Object.keys(ev.fields).length > 0;
    // check whether pretty print is disabled
    if (!this.config.prettyPrint) {
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

    console.log.apply(console, [msgString, ...args]);
  }

  flush() {
    return;
  }
}
