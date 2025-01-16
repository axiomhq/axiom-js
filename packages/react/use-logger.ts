import { Logger } from '@axiomhq/logger';
import { useEffect, useState } from 'react';

export function createUseLogger(logger: Logger) {
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
