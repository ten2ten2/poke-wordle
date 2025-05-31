import { Metadata } from 'next';

const locales = ['en', 'ja', 'fr', 'de', 'it', 'es', 'ko', 'zh-hans', 'zh-hant'];

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  
  if (!locales.includes(locale)) {
    return {};
  }
  
  // SEO-optimized metadata for privacy policy in different languages
  const localeMetadata = {
    en: {
      title: 'Privacy Policy & Terms - Poke Wordle',
      description: 'Read our privacy policy and terms of service for Poke Wordle. Learn how we protect your data, what we collect, and our game usage policies. Your privacy matters to us.',
      keywords: ['privacy policy', 'terms of service', 'data protection', 'poke wordle', 'pokemon game privacy'],
    },
    ja: {
      title: 'プライバシーポリシーと利用規約 - ポケワードル',
      description: 'ポケワードルのプライバシーポリシーと利用規約をお読みください。データ保護、収集情報、ゲーム利用ポリシーについて説明します。プライバシーを重視しています。',
      keywords: ['プライバシーポリシー', '利用規約', 'データ保護', 'ポケワードル', 'ポケモンゲーム'],
    },
    fr: {
      title: 'Politique de Confidentialité et Conditions - Poke Wordle',
      description: 'Consultez notre politique de confidentialité et nos conditions d\'utilisation pour Poke Wordle. Découvrez comment nous protégeons vos données et nos politiques d\'utilisation.',
      keywords: ['politique de confidentialité', 'conditions utilisation', 'protection données', 'poke wordle', 'jeu pokemon'],
    },
    de: {
      title: 'Datenschutz & Nutzungsbedingungen - Poke Wordle',
      description: 'Lesen Sie unsere Datenschutzerklärung und Nutzungsbedingungen für Poke Wordle. Erfahren Sie, wie wir Ihre Daten schützen und unsere Nutzungsrichtlinien.',
      keywords: ['datenschutzerklärung', 'nutzungsbedingungen', 'datenschutz', 'poke wordle', 'pokemon spiel'],
    },
    it: {
      title: 'Privacy e Termini di Servizio - Poke Wordle',
      description: 'Leggi la nostra informativa sulla privacy e i termini di servizio per Poke Wordle. Scopri come proteggiamo i tuoi dati e le nostre politiche di utilizzo.',
      keywords: ['informativa privacy', 'termini servizio', 'protezione dati', 'poke wordle', 'gioco pokemon'],
    },
    es: {
      title: 'Privacidad y Términos de Servicio - Poke Wordle',
      description: 'Lee nuestra política de privacidad y términos de servicio para Poke Wordle. Conoce cómo protegemos tus datos y nuestras políticas de uso del juego.',
      keywords: ['política privacidad', 'términos servicio', 'protección datos', 'poke wordle', 'juego pokemon'],
    },
    ko: {
      title: '개인정보 처리방침 및 이용약관 - 포케 워들',
      description: '포케 워들의 개인정보 처리방침과 이용약관을 확인하세요. 데이터 보호 방법과 게임 이용 정책에 대해 알아보세요. 개인정보 보호를 중시합니다.',
      keywords: ['개인정보 처리방침', '이용약관', '데이터 보호', '포케 워들', '포켓몬 게임'],
    },
    'zh-hans': {
      title: '隐私政策与服务条款 - 宝可梦猜猜乐',
      description: '阅读宝可梦猜猜乐的隐私政策和服务条款。了解我们如何保护您的数据、收集的信息以及游戏使用政策。我们重视您的隐私。',
      keywords: ['隐私政策', '服务条款', '数据保护', '宝可梦猜猜乐', '宝可梦游戏'],
    },
    'zh-hant': {
      title: '隱私政策與服務條款 - 寶可夢猜猜樂',
      description: '閱讀寶可夢猜猜樂的隱私政策和服務條款。了解我們如何保護您的資料、收集的資訊以及遊戲使用政策。我們重視您的隱私。',
      keywords: ['隱私政策', '服務條款', '資料保護', '寶可夢猜猜樂', '寶可夢遊戲'],
    },
  };

  const currentLocaleData = localeMetadata[locale as keyof typeof localeMetadata];
  
  // Generate correct URLs for English vs other locales
  const canonicalUrl = locale === 'en' ? '/privacy-and-terms' : `/${locale}/privacy-and-terms`;
  const ogUrl = locale === 'en' 
    ? 'https://www.pokewordle.app/privacy-and-terms' 
    : `https://www.pokewordle.app/${locale}/privacy-and-terms`;
  
  return {
    title: currentLocaleData.title,
    description: currentLocaleData.description,
    keywords: currentLocaleData.keywords,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': '/privacy-and-terms',
        'ja': '/ja/privacy-and-terms',
        'fr': '/fr/privacy-and-terms',
        'de': '/de/privacy-and-terms',
        'it': '/it/privacy-and-terms',
        'es': '/es/privacy-and-terms',
        'ko': '/ko/privacy-and-terms',
        'zh-Hans': '/zh-hans/privacy-and-terms',
        'zh-Hant': '/zh-hant/privacy-and-terms',
      },
    },
    openGraph: {
      title: currentLocaleData.title,
      description: currentLocaleData.description,
      url: ogUrl,
      type: 'website',
      siteName: 'Poke Wordle',
    },
    twitter: {
      card: 'summary',
      title: currentLocaleData.title,
      description: currentLocaleData.description,
    },
  };
}

export default function PrivacyAndTermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 