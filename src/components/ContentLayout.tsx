import type { ReactNode } from 'react';
import type { KnowledgeArticle } from '@/config/knowledge';
import Breadcrumb, { type BreadcrumbItem } from './Breadcrumb';
import Footer from './Footer';
import Navbar from './Navbar';

export default function ContentLayout({ children, breadcrumbs, currentArticle }: {
  children: ReactNode;
  breadcrumbs: BreadcrumbItem[];
  currentArticle?: KnowledgeArticle;
}) {
  return (
    <div className="min-h-screen-safe bg-page flex flex-col safe-all">
      <Navbar showAbout={false} showSettings={false} currentArticle={currentArticle} />
      <main className="w-full flex-1 container-responsive section-padding">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <Breadcrumb items={breadcrumbs} />
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
