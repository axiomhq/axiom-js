'use client';
import { Axiom } from '@axiomhq/js'
import { useEffect } from 'react';

export default function Home() {
  const axiom = new Axiom()

  axiom.ingest({
    name: 'test',
  })

  useEffect(() => {
    return async () => {
      await axiom.flush();
    }
  })

  return (
    <div>Test</div>
  )
}
