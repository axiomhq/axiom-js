'use client';
import { Axiom } from '@axiomhq/js'
import { useEffect } from 'react';

export default function Home() {
  const axiom = new Axiom({ token: process.env.AXIOM_TOKEN, url: process.env.AXIOM_URL, orgId: process.env.AXIOM_ORG_ID })

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
