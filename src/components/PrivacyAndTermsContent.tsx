'use client';

import { useTranslations, useLocale } from 'next-intl';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeftIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Breadcrumb from '@/components/Breadcrumb';

export default function PrivacyAndTermsContent() {
  const t = useTranslations();
  const locale = useLocale();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  // Set date on client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString(locale));
  }, [locale]);

  // Generate the correct href for home page
  const homeHref = locale === 'en' ? '/' : `/${locale}`;

  return (
    <div className="min-h-screen-safe bg-gray-50 flex flex-col safe-all">
      {/* Simplified Navbar for Privacy Page */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 safe-top">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo/Title */}
            <div className="flex-shrink-0">
              <Link href={homeHref} title={t('title')} className="hover:opacity-80 transition-opacity">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {t('title')}
                </h1>
              </Link>
            </div>
            
            {/* Navigation Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Language Button */}
              <button
                onClick={() => setIsLanguageOpen(true)}
                className="touch-target p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
                aria-label={t('navbar.language')}
                title={t('navbar.language')}
              >
                <LanguageIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Language Switcher Modal */}
      <LanguageSwitcher
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
      />

      <main className="flex-1 container-responsive section-padding">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb
              items={[
                {
                  label: t('privacyAndTerms.title'),
                  current: true
                }
              ]}
            />
          </div>

          {/* Page Header */}
          <div className="card card-padding mb-8">
            <h2 className="text-responsive-2xl font-bold text-gray-900 mb-4">
              {t('privacyAndTerms.title')}
            </h2>
            {currentDate && (
              <p className="text-responsive-sm text-gray-600">
                {t('privacyAndTerms.lastUpdated', { date: currentDate })}
              </p>
            )}
          </div>

          {/* Privacy Policy Section */}
          <section className="card card-padding mb-8">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-6">
              {t('privacyAndTerms.privacyPolicy.title')}
            </h2>

            <div className="space-y-6">
              {/* Introduction */}
              <div>
                <p className="text-responsive-base text-gray-700 leading-relaxed">
                  {t('privacyAndTerms.privacyPolicy.introduction')}
                </p>
              </div>

              {/* Information Collection */}
              <div>
                <h3 className="text-responsive-lg font-semibold text-gray-900 mb-3">
                  {t('privacyAndTerms.privacyPolicy.informationCollection.title')}
                </h3>
                <p className="text-responsive-base text-gray-700 mb-3">
                  {t('privacyAndTerms.privacyPolicy.informationCollection.description')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-responsive-base text-gray-700 ml-4">
                  {t.raw('privacyAndTerms.privacyPolicy.informationCollection.items').map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Data Storage */}
              <div>
                <h3 className="text-responsive-lg font-semibold text-gray-900 mb-3">
                  {t('privacyAndTerms.privacyPolicy.dataStorage.title')}
                </h3>
                <p className="text-responsive-base text-gray-700 mb-3">
                  {t('privacyAndTerms.privacyPolicy.dataStorage.description')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-responsive-base text-gray-700 ml-4">
                  {t.raw('privacyAndTerms.privacyPolicy.dataStorage.items').map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Cookies */}
              <div>
                <h3 className="text-responsive-lg font-semibold text-gray-900 mb-3">
                  {t('privacyAndTerms.privacyPolicy.cookies.title')}
                </h3>
                <p className="text-responsive-base text-gray-700">
                  {t('privacyAndTerms.privacyPolicy.cookies.description')}
                </p>
              </div>

              {/* Third Party */}
              <div>
                <h3 className="text-responsive-lg font-semibold text-gray-900 mb-3">
                  {t('privacyAndTerms.privacyPolicy.thirdParty.title')}
                </h3>
                <p className="text-responsive-base text-gray-700">
                  {t('privacyAndTerms.privacyPolicy.thirdParty.description')}
                </p>
              </div>

              {/* Data Rights */}
              <div>
                <h3 className="text-responsive-lg font-semibold text-gray-900 mb-3">
                  {t('privacyAndTerms.privacyPolicy.dataRights.title')}
                </h3>
                <p className="text-responsive-base text-gray-700 mb-3">
                  {t('privacyAndTerms.privacyPolicy.dataRights.description')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-responsive-base text-gray-700 ml-4">
                  {t.raw('privacyAndTerms.privacyPolicy.dataRights.items').map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Terms of Service Section */}
          <section className="card card-padding mb-8">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-6">
              {t('privacyAndTerms.termsOfService.title')}
            </h2>

            <div className="space-y-6">
              {/* Introduction */}
              <div>
                <p className="text-responsive-base text-gray-700 leading-relaxed">
                  {t('privacyAndTerms.termsOfService.introduction')}
                </p>
              </div>

              {/* Game Content */}
              <div>
                <h3 className="text-responsive-lg font-semibold text-gray-900 mb-3">
                  {t('privacyAndTerms.termsOfService.gameContent.title')}
                </h3>
                <p className="text-responsive-base text-gray-700">
                  {t('privacyAndTerms.termsOfService.gameContent.description')}
                </p>
              </div>

              {/* User Conduct */}
              <div>
                <h3 className="text-responsive-lg font-semibold text-gray-900 mb-3">
                  {t('privacyAndTerms.termsOfService.userConduct.title')}
                </h3>
                <p className="text-responsive-base text-gray-700 mb-3">
                  {t('privacyAndTerms.termsOfService.userConduct.description')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-responsive-base text-gray-700 ml-4">
                  {t.raw('privacyAndTerms.termsOfService.userConduct.items').map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div>
                <h3 className="text-responsive-lg font-semibold text-gray-900 mb-3">
                  {t('privacyAndTerms.termsOfService.disclaimer.title')}
                </h3>
                <p className="text-responsive-base text-gray-700">
                  {t('privacyAndTerms.termsOfService.disclaimer.description')}
                </p>
              </div>

              {/* Modifications */}
              <div>
                <h3 className="text-responsive-lg font-semibold text-gray-900 mb-3">
                  {t('privacyAndTerms.termsOfService.modifications.title')}
                </h3>
                <p className="text-responsive-base text-gray-700">
                  {t('privacyAndTerms.termsOfService.modifications.description')}
                </p>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-responsive-lg font-semibold text-gray-900 mb-3">
                  {t('privacyAndTerms.termsOfService.contact.title')}
                </h3>
                <p className="text-responsive-base text-gray-700">
                  {t('privacyAndTerms.termsOfService.contact.description')}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
} 