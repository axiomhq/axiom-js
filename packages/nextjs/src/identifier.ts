import type { Formatter, FrameworkIdentifier, LogEvent, Logger } from '@axiomhq/logging';
import { Version } from './lib/runtime';

export const frameworkIdentifier = {
  name: 'next-axiom-version',
  version: Version ?? 'unknown',
} satisfies FrameworkIdentifier;

export const axiomClient = `axiom-nextjs/${Version ?? 'unknown'}`;

type AxiomClientLogger = Logger & {
  appendAxiomClient?: (axiomClient: string) => void;
};

export const appendNextJsAxiomClient = (logger: Logger) => {
  (logger as AxiomClientLogger).appendAxiomClient?.(axiomClient);
};

export const frameworkIdentifierFormatter: Formatter<LogEvent, LogEvent> = (logEvent) => {
  return {
    ...logEvent,
    '@app': {
      [frameworkIdentifier.name]: frameworkIdentifier.version,
    },
  };
};
