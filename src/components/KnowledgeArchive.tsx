'use client';

import { useTranslations } from 'next-intl';
import Breadcrumb from '@/components/Breadcrumb';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function KnowledgeArchive() {
  const t = useTranslations();
  
  // Knowledge page is only available in these languages
  const knowledgeLocales = ['en', 'ja', 'zh-hans', 'zh-hant'];
  
  const breadcrumbItems = [
    {
      label: t('knowledge.title'),
      current: true
    }
  ];

  return (
    <div className="min-h-screen-safe bg-gray-50 flex flex-col safe-all">
      {/* 使用自定义 Navbar */}
      <Navbar 
        showAbout={false}
        showSettings={false}
        availableLocales={knowledgeLocales}
      />
      
      <main className="w-screen flex-1 container-responsive section-padding">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          
          {/* Page Header */}
          <div className="card card-padding mb-8">
            <h2 className="text-responsive-2xl font-bold text-gray-900 mb-4">
              {t('knowledge.title')}
            </h2>
            <p className="text-responsive-sm text-gray-600">
              {t('knowledge.description')}
            </p>
          </div>
          
          {/* Content */}
          <div className="card card-padding mb-8">
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h2 className="text-responsive-lg font-semibold text-gray-900 mb-2">
                {t('knowledge.title')}
              </h2>
              <p className="text-responsive-base text-gray-600 max-w-md mx-auto">
                {t('knowledge.comingSoon')}
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 