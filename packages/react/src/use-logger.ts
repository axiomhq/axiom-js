'use client';
import { Logger } from '@axiomhq/logging';
import { useEffect, useState } from 'react';
import { useDeepCompareMemo } from 'use-deep-compare';

export function createUseLogger(logger: Logger) {
  if (!logger) {
    throw new Error('A logger must be provided to create useLogger');
  }

  const useLogger = ({ args }: { args?: Record<string, any> } = {}) => {
    const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '');

    const hookLogger = useDeepCompareMemo(() => {
      if (!args) {
        return logger;
      }
      return logger.with({
        ...args,
        path,
      });
    }, [args, path]);

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

    return hookLogger;
  };

  return useLogger;
}
