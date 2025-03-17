import Button from '@/app/_components/button';
import { logger } from '@/lib/axiom/server';
import Link from 'next/link';
import { after } from 'next/server';

export default async function Home({ params }: { params: Promise<{ path: string[] }> }) {
  const path = await params;

  if (path.path.includes('throw')) {
    throw new Error('Test error');
  }

  logger.info('Hello World!', { key: 'value' });

  after(() => {
    logger.flush();
  });

  return (
    <div>
      <Button />
      <div className="flex gap-2">
        <Link href="/about">About</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/home">Home</Link>
      </div>
    </div>
  );
}
