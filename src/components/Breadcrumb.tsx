import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';
import JsonLd from '@/components/mdx/JsonLd';
import { absoluteUrl } from '@/config/seo';
import { localePath } from '@/i18n/routing';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const t = useTranslations();
  const locale = useLocale();

  const homeHref = localePath(locale);

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [{ label: t('common.home'), href: homeHref }, ...items].map((item, index) => ({
          '@type': 'ListItem', position: index + 1, name: item.label,
          ...(item.href ? { item: absoluteUrl(item.href) } : {}),
        })),
      }} />
      <nav
        className={`flex ${className}`}
        aria-label={t('common.breadcrumb')}
      >
        <ol role="list" className="flex flex-wrap items-center gap-y-2 space-x-2">
          <li>
            <div>
              <Link
                href={homeHref}
                className="text-muted hover:text-muted transition-colors duration-200"
                title={t('common.home')}
              >
                <HomeIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="sr-only">
                  {t('common.home')}
                </span>
              </Link>
            </div>
          </li>

          {items.map((item, index) => (
            <li key={index}>
              <div className="flex items-center">
                <ChevronRightIcon
                  className="h-5 w-5 shrink-0 text-muted"
                  aria-hidden="true"
                />
                {item.href && !item.current ? (
                  <Link
                    href={item.href}
                    title={item.label}
                    className="ml-2 text-sm font-medium text-muted hover:text-secondary transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={`ml-2 text-sm font-medium ${
                      item.current ? 'text-foreground' : 'text-muted'
                    }`}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
