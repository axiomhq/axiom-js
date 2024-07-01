import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  throw new Error(" Example API Route Error");
};
