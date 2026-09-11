import { setRequestLocale } from 'next-intl/server';
import PrivacyAndTermsContent from '@/components/PrivacyAndTermsContent';

export default async function PrivacyAndTermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyAndTermsContent />;
}
