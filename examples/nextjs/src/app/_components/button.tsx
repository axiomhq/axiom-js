'use client';

import { useLogger } from '@/lib/axiom/client';

export default function Button() {
  const logger = useLogger();
  return (
    <div>
      <button style={{ color: 'red' }} onClick={() => logger.info('Hello World from Client Side!', { key: 'value' })}>
        Log
      </button>
    </div>
  );
}
