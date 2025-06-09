import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { generateGameStructuredData, generateBreadcrumbStructuredData, generateFAQStructuredData } from '@/utils/seo';

const locales = ['en', 'ja', 'fr', 'de', 'it', 'es', 'ko', 'zh-hans', 'zh-hant'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  
  if (!locales.includes(locale)) {
    return {};
  }
  
  // Locale-specific keywords
  const localeKeywords = {
    en: [
      'pokemon', 'wordle', 'game', 'legends z-a', 'pokemon game', 'ptcg', 'nintendo',
      'pokemon go', 'pokemon training card game'
    ],
    ja: [
      'ポケモン', 'ワードル', 'ゲーム', 'ポケモンゲーム','nintendo', 'ポケモンGO', 'ポケモンカード',
      'ptcg', 'vgc', 'ポケモンカードゲーム', 'ポケモンスカーレット', 'legends z-a'
    ],
    fr: [
      'pokemon', 'wordle', 'jeu', 'legends z-a', 'jeu pokemon', 'ptcg', 'nintendo',
      'pokemon go', 'jeu de cartes pokemon'
    ],
    de: [
      'pokemon', 'wordle', 'spiel', 'legends z-a', 'pokemon spiel', 'ptcg', 'nintendo',
      'pokemon go', 'pokemon sammelkartenspiel'
    ],
    it: [
      'pokemon', 'wordle', 'gioco', 'legends z-a', 'gioco pokemon', 'ptcg', 'nintendo',
      'pokemon go', 'gioco di carte pokemon'
    ],
    es: [
      'pokemon', 'wordle', 'juego', 'legends z-a', 'juego pokemon', 'ptcg', 'nintendo',
      'pokemon go', 'juego de cartas pokemon'
    ],
    ko: [
      '포켓몬', '워들', '게임', '포켓몬게임', 'nintendo', '포켓몬고', '포켓몬카드',
      'ptcg', 'vgc', '포켓몬카드게임', '포켓몬스카레트', 'legends z-a', '포켓몬블루', '포켓몬스카렛'
    ],
    'zh-hans': [
      '宝可梦', '猜词游戏', '游戏', '宝可梦游戏', '宝可梦问答', '任天堂', '宝可梦GO', 
      '宝可梦卡牌', '宝可梦传说 Z-A', '宝可梦朱紫', '宝可梦传说阿尔宙斯', '宝可梦对战',
      'pokemon go', 'vgc', 'ptcg'
    ],
    'zh-hant': [
      '寶可夢', '猜詞遊戲', '遊戲', '寶可夢遊戲', '寶可夢問答', '任天堂', '寶可夢GO', 
      '寶可夢卡牌', '寶可夢傳說 Z-A', '寶可夢朱紫', '寶可夢傳說 阿爾宙斯', '寶可夢對戰',
      'pokemon go', 'vgc', 'ptcg'
    ],
  };

  // Locale-specific metadata
  const localeMetadata = {
    en: {
      title: 'Poke Wordle - Guess the Pokémon Game',
      description: 'Test your Pokémon knowledge with Poke Wordle! Guess the Pokémon based on its attributes, stats, abilities, evolution, and more.',
      keywords: localeKeywords.en,
      ogLocale: 'en_US',
    },
    ja: {
      title: 'ポケワードル - ポケモン当てゲーム',
      description: 'ポケワードルでポケモンの知識をテストしよう！属性、ステータス、特性、進化などからポケモンを当てるゲームです。',
      keywords: localeKeywords.ja,
      ogLocale: 'ja_JP',
    },
    fr: {
      title: 'Poke Wordle - Devinez le Pokémon',
      description: 'Testez vos connaissances Pokémon avec Poke Wordle ! Devinez le Pokémon basé sur ses attributs, statistiques, capacités, évolution et plus.',
      keywords: localeKeywords.fr,
      ogLocale: 'fr_FR',
    },
    de: {
      title: 'Poke Wordle - Pokémon Ratespiel',
      description: 'Teste dein Pokémon-Wissen mit Poke Wordle! Rate das Pokémon anhand seiner Eigenschaften, Werte, Fähigkeiten, Entwicklung und mehr.',
      keywords: localeKeywords.de,
      ogLocale: 'de_DE',
    },
    it: {
      title: 'Poke Wordle - Indovina il Pokémon',
      description: 'Metti alla prova la tua conoscenza dei Pokémon con Poke Wordle! Indovina il Pokémon basandoti sui suoi attributi, statistiche, abilità, evoluzione e altro.',
      keywords: localeKeywords.it,
      ogLocale: 'it_IT',
    },
    es: {
      title: 'Poke Wordle - Adivina el Pokémon',
      description: '¡Pon a prueba tu conocimiento de Pokémon con Poke Wordle! Adivina el Pokémon basándote en sus atributos, estadísticas, habilidades, evolución y más.',
      keywords: localeKeywords.es,
      ogLocale: 'es_ES',
    },
    ko: {
      title: '포케 워들 - 포켓몬 맞추기 게임',
      description: '포케 워들로 포켓몬 지식을 테스트해보세요! 속성, 스탯, 특성, 진화 등을 바탕으로 포켓몬을 맞춰보세요.',
      keywords: localeKeywords.ko,
      ogLocale: 'ko_KR',
    },
    'zh-hans': {
      title: '宝可梦猜猜乐 - 猜宝可梦游戏',
      description: '用宝可梦猜猜乐测试你的宝可梦知识！根据属性、数值、特性、进化等信息猜出宝可梦。',
      keywords: localeKeywords['zh-hans'],
      ogLocale: 'zh_CN',
    },
    'zh-hant': {
      title: '寶可夢猜猜樂 - 猜寶可夢遊戲',
      description: '用寶可夢猜猜樂測試你的寶可夢知識！根據屬性、數值、特性、進化等資訊猜出寶可夢。',
      keywords: localeKeywords['zh-hant'],
      ogLocale: 'zh_TW',
    },
  };

  const currentLocaleData = localeMetadata[locale as keyof typeof localeMetadata];
  
  // Generate correct URLs for English vs other locales
  const canonicalUrl = locale === 'en' ? '/' : `/${locale}`;
  const ogUrl = locale === 'en' ? 'https://www.pokewordle.app' : `https://www.pokewordle.app/${locale}`;
  
  return {
    title: currentLocaleData.title,
    description: currentLocaleData.description,
    keywords: currentLocaleData.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'x-default': '/',
        'en': '/',
        'ja': '/ja',
        'fr': '/fr',
        'de': '/de',
        'it': '/it',
        'es': '/es',
        'ko': '/ko',
        'zh-Hans': '/zh-hans',
        'zh-Hant': '/zh-hant',
      },
    },
    openGraph: {
      title: currentLocaleData.title,
      description: currentLocaleData.description,
      url: ogUrl,
      locale: currentLocaleData.ogLocale,
      alternateLocale: Object.values(localeMetadata).map(data => data.ogLocale).filter(loc => loc !== currentLocaleData.ogLocale),
    },
    twitter: {
      title: currentLocaleData.title,
      description: currentLocaleData.description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) notFound();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Generate structured data for this locale
  const gameStructuredData = generateGameStructuredData(locale);
  const breadcrumbStructuredData = generateBreadcrumbStructuredData(locale);
  const faqStructuredData = generateFAQStructuredData(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(gameStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData)
        }}
      />
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </>
  );
} 