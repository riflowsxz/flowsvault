import { env } from './env';

const FALLBACK_SITE_URL = 'http://localhost:3000';

export const getSiteUrl = (): string => {
  const envUrl = (env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL) ?? FALLBACK_SITE_URL;
  return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
};

export const getGaMeasurementId = (): string | undefined => {
  const gaId = (env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_GA_ID)?.trim();
  return gaId ? gaId : undefined;
};
