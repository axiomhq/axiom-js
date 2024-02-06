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
  dataset: string;
}

export default async function axiomTransport(options: Options) {
  const axiom = new Axiom(options);
  const dataset = options.dataset;

  return build(
    async function (source: any) {
      const ingestPromises: Promise<void>[] = [];
      for await (const obj of source) {
        const { time, level, ...rest } = obj;
        const event = {
          _time: time,
          level: mapLogLevel(level),
          ...rest,
        };

        // Wrap the ingest call in a Promise for proper async handling
        const ingestPromise = new Promise<void>((resolve, reject) => {
          axiom.ingest(dataset, event);
          resolve(); // Resolve the promise once ingest is called
        }).catch((error: Error) => {
          console.error("Failed to ingest log to Axiom:", error);
        });

        ingestPromises.push(ingestPromise);
      }

      // Wait for all ingestion to complete
      await Promise.all(ingestPromises);
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