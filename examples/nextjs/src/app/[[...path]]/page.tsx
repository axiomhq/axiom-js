import Button from '@/app/_components/button';
import { logger } from '@/lib/axiom/server';
import Link from 'next/link';
import { after } from 'next/server';

export default function Home() {
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
