'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';

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

  // Generate the correct href for home page
  const homeHref = locale === 'en' ? '/' : `/${locale}`;

  return (
    <nav
      className={`flex ${className}`}
      aria-label={t('common.breadcrumb', { defaultValue: 'Breadcrumb' })}
    >
      <ol role="list" className="flex items-center space-x-2">
        {/* Home link */}
        <li>
          <div>
            <Link
              href={homeHref}
              className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              title={t('common.home', { defaultValue: 'Home' })}
            >
              <HomeIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="sr-only">
                {t('common.home', { defaultValue: 'Home' })}
              </span>
            </Link>
          </div>
        </li>

        {/* Breadcrumb items */}
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              <ChevronRightIcon
                className="h-5 w-5 shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {item.href && !item.current ? (
                <Link
                  href={item.href}
                  className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`ml-2 text-sm font-medium ${
                    item.current ? 'text-gray-900' : 'text-gray-500'
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
  );
}
