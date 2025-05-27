import Head from 'next/head';
import { getRobotsMetaTag } from '@/utils/seo-robots';

interface SEOHeadProps {
  pageType?: 'GAME_PAGE' | 'LEGAL_PAGE' | 'API_NOINDEX' | 'DEV_NOINDEX';
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  additionalMeta?: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;
}

export default function SEOHead({
  pageType = 'GAME_PAGE',
  title,
  description,
  canonical,
  noindex = false,
  nofollow = false,
  additionalMeta = []
}: SEOHeadProps) {
  // Generate robots content
  let robotsContent = '';
  
  if (noindex || nofollow) {
    const robotsArray = [];
    if (noindex) robotsArray.push('noindex');
    if (nofollow) robotsArray.push('nofollow');
    robotsContent = robotsArray.join(',');
  } else {
    robotsContent = getRobotsMetaTag(pageType);
  }

  return (
    <Head>
      {/* Robots meta tag */}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="bingbot" content={robotsContent} />
      
      {/* Additional title and description if provided */}
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Additional meta tags */}
      {additionalMeta.map((meta, index) => (
        <meta
          key={index}
          {...(meta.name ? { name: meta.name } : {})}
          {...(meta.property ? { property: meta.property } : {})}
          content={meta.content}
        />
      ))}
      
      {/* Search engine specific directives */}
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />
      
      {/* Prevent automatic phone number detection */}
      <meta name="format-detection" content="telephone=no" />
      
      {/* Optimize for mobile */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    </Head>
  );
} 