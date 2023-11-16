import { LogEvent } from "./type";

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
    let msgString = '';
    let args: any[] = [ev.level, ev.message];
    msgString = `\x1b[${levelColors[ev.level].terminal}m%s\x1b[0m - %s`;
    // we check if the fields object is not empty, otherwise its printed as <empty string>
    // or just "".
    if (hasFields) {
      msgString += ' %o';
      args.push(ev.fields);
    }
    console.log.apply(console, [msgString, ...args]);
}



export function jsonFriendlyErrorReplacer(key: string, value: any) {
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
  
export function throttle (fn: Function, wait: number)  {
      let lastFn: ReturnType<typeof setTimeout>, lastTime: number;
      return function (this: any) {
        const context = this,
          args = arguments;
        // First call, set lastTime
        if (lastTime == null) {
          lastTime = Date.now();
        } 
        clearTimeout(lastFn);
        lastFn = setTimeout(
          () => {
            if (Date.now() - lastTime >= wait) {
              fn.apply(context, args);
              lastTime = Date.now();
            }
          },
          Math.max(wait - (Date.now() - lastTime), 0)
        );
      };
};