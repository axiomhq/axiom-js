'use client';

import { useLogger } from '@/lib/axiom/client';

export default function Button() {
  const logger = useLogger();

  const handleClick = () => {
    logger.info('Hello World from Client Side!', { key: 'value' });
  };

  return (
    <div>
      <button style={{ color: 'red' }} onClick={handleClick}>
        Log
      </button>
    </div>
  );
}
