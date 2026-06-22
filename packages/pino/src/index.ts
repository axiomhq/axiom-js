import build from 'pino-abstract-transport';
import { Axiom } from '@axiomhq/js';
import type { ClientOptions } from '@axiomhq/js';

const Version = 'AXIOM_VERSION';
const AxiomClient = `axiom-pino/${Version}`;

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
  /**
   * Additional product tokens to append to the Axiom-Client header.
   * Use product/version tokens separated by spaces.
   *
   * @example "axiom-react/1.2.3 my-app/4.5.6"
   */
  axiomClient?: string;
}

export default async function axiomTransport(options: Options) {
  const clientOptions: ClientOptions = {
    ...options,
    axiomClient: appendAxiomClient(AxiomClient, options.axiomClient),
  };
  const axiom = new Axiom(clientOptions);

  const dataset = options.dataset;

  return build(
    async function (source: any) {
      for await (const obj of source) {
        const { time, level, ...rest } = obj;

        const event = {
          _time: time,
          level: mapLogLevel(level),
          ...rest,
        };

        axiom.ingest(dataset, event);
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

function appendAxiomClient(baseAxiomClient: string, axiomClient?: string): string {
  const trimmedAxiomClient = axiomClient?.trim();
  if (!trimmedAxiomClient) {
    return baseAxiomClient;
  }

  return `${baseAxiomClient} ${trimmedAxiomClient}`;
}
