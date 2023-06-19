import build from 'pino-abstract-transport';
import { Axiom, ClientOptions } from '@axiomhq/js';

export enum AxiomEventLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
  Silent = 'silent',
}

export interface Options extends ClientOptions {
  dataset?: string;
}

export default async function axiomTransport(options?: Options) {
  const axiom = new Axiom(options);
  const dataset = options?.dataset || process.env.AXIOM_DATASET;

  return build(
    async function (source: any) {
      for await (const obj of source) {
        const { time, level, ...rest } = obj;

        const event = {
          _time: time,
          level: mapLogLevel(level),
          ...rest,
        };

        axiom.ingest(dataset!, event);
      }
    },
    { close: async () => await axiom.flush() },
  );
}

// See https://github.com/pinojs/pino/blob/master/docs/api.md#loggerlevel-string-gettersetter
export const mapLogLevel = (level: string | number) => {
  if (typeof level === 'string') {
    return level;
  }

  if (level <= 10) {
    return AxiomEventLevel.Trace;
  }
  if (level <= 20) {
    return AxiomEventLevel.Debug;
  }
  if (level <= 30) {
    return AxiomEventLevel.Info;
  }
  if (level <= 40) {
    return AxiomEventLevel.Warn;
  }
  if (level <= 50) {
    return AxiomEventLevel.Error;
  }
  if (level <= 60) {
    return AxiomEventLevel.Fatal;
  }

  return AxiomEventLevel.Silent;
};
