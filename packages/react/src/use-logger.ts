'use client';
import { Logger } from '@axiomhq/logging';
import { useEffect, useState } from 'react';
import { axiomClient, frameworkIdentifierFormatter } from './identifier';

type AxiomClientLogger = Logger & {
  appendAxiomClient?: (axiomClient: string) => void;
};

export function createUseLogger(logger: Logger) {
  if (!logger) {
    throw new Error('A logger must be provided to create useLogger');
  }

  if (logger.config && !logger.config.formatters?.includes(frameworkIdentifierFormatter)) {
    logger.config.formatters = [...(logger.config.formatters ?? []), frameworkIdentifierFormatter];
  }
  (logger as AxiomClientLogger).appendAxiomClient?.(axiomClient);

  const useLogger = () => {
    const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '');

    useEffect(() => {
      const handleLocationChange = () => {
        setPath(window.location.pathname);
      };

      window.addEventListener('popstate', handleLocationChange);
      window.addEventListener('pushState', handleLocationChange);
      window.addEventListener('replaceState', handleLocationChange);

      return () => {
        window.removeEventListener('popstate', handleLocationChange);
        window.removeEventListener('pushState', handleLocationChange);
        window.removeEventListener('replaceState', handleLocationChange);
      };
    }, []);

    useEffect(() => {
      return () => {
        if (logger) {
          logger.flush();
        }
      };
    }, [path]);

    return logger;
  };

  return useLogger;
}
