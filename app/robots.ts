import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const { host } = new URL(siteUrl);

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    host,
    sitemap: [`${siteUrl}/sitemap.xml`],
  };
}
