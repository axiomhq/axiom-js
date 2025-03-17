export const isVercel = process.env.NEXT_PUBLIC_VERCEL || process.env.VERCEL;
export const isNetlify = process.env.NETLIFY == 'true';

export const environment = process.env.NODE_ENV;
export const region = process.env.REGION || undefined;
