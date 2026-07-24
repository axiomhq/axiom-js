import type { Formatter, FrameworkIdentifier, LogEvent } from '@axiomhq/logging';
import { Version } from './lib/runtime';

export const frameworkIdentifier = {
  name: 'react-axiom-version',
  version: Version ?? 'unknown',
} satisfies FrameworkIdentifier;

export const axiomClient = `axiom-react/${Version ?? 'unknown'}`;

export const frameworkIdentifierFormatter: Formatter<LogEvent, LogEvent> = (logEvent) => {
  return {
    ...logEvent,
    '@app': {
      ...logEvent['@app'],
      [frameworkIdentifier.name]: frameworkIdentifier.version,
    },
  };
};
