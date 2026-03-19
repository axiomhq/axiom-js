export const getEnv = (key: string) => ('process' in globalThis ? globalThis.process.env[key] : undefined);

export const isVercel = getEnv('NEXT_PUBLIC_VERCEL') || getEnv('VERCEL');
export const isNetlify = getEnv('NETLIFY') == 'true';

export const environment = getEnv('NODE_ENV');
export const region = getEnv('REGION') || undefined;
