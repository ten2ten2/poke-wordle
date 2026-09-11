import type { Metadata } from 'next';
import { localePath, routing } from '@/i18n/routing';

export const SITE_URL = 'https://www.pokewordle.app';
export const SITE_NAME = 'Poke Wordle';
export type SiteLocale = (typeof routing.locales)[number];

const ogLocales: Record<SiteLocale, string> = {
  en: 'en_US', ja: 'ja_JP', fr: 'fr_FR', de: 'de_DE', it: 'it_IT',
  es: 'es_ES', ko: 'ko_KR', 'zh-hans': 'zh_CN', 'zh-hant': 'zh_TW',
};

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).href;

export function pageAlternates(path: string, locales: readonly string[] = routing.locales) {
  return Object.fromEntries([
    ...locales.map((locale) => [locale, localePath(locale, path)]),
    ['x-default', localePath('en', path)],
  ]);
}

interface PageMetadata {
  locale: SiteLocale;
  title: string;
  description: string;
  path: string;
  languages: Record<string, string>;
  image?: string;
  article?: { createdAt: string; updatedAt?: string };
}

export function pageMetadata({ locale, title, description, path, languages, image, article }: PageMetadata): Metadata {
  const images = [image || '/images/og-image.png'];
  const common = {
    title, description, url: absoluteUrl(path), siteName: SITE_NAME,
    images, locale: ogLocales[locale],
    alternateLocale: Object.keys(languages)
      .filter((language) => language !== locale && language in ogLocales)
      .map((language) => ogLocales[language as SiteLocale]),
  };
  return {
    title, description,
    alternates: { canonical: absoluteUrl(path), languages },
    openGraph: article
      ? { ...common, type: 'article', publishedTime: article.createdAt, modifiedTime: article.updatedAt ?? article.createdAt }
      : { ...common, type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : ['/images/twitter-image.png'] },
  };
}

export const homeMetadata = {
  en: {
    title: 'Poke Wordle - Guess the Pokémon Game',
    description:
      'Test your Pokémon knowledge with Poke Wordle! Guess the Pokémon based on its attributes, stats, abilities, evolution, and more.',
  },
  ja: {
    title: 'ポケワードル - ポケモン当てゲーム',
    description:
      'ポケワードルでポケモンの知識をテストしよう！属性、ステータス、特性、進化などからポケモンを当てるゲームです。',
  },
  fr: {
    title: 'Poke Wordle - Devinez le Pokémon',
    description:
      'Testez vos connaissances Pokémon avec Poke Wordle ! Devinez le Pokémon basé sur ses attributs, statistiques, capacités, évolution et plus.',
  },
  de: {
    title: 'Poke Wordle - Pokémon Ratespiel',
    description:
      'Teste dein Pokémon-Wissen mit Poke Wordle! Rate das Pokémon anhand seiner Eigenschaften, Werte, Fähigkeiten, Entwicklung und mehr.',
  },
  it: {
    title: 'Poke Wordle - Indovina il Pokémon',
    description:
      'Metti alla prova la tua conoscenza dei Pokémon con Poke Wordle! Indovina il Pokémon basandoti sui suoi attributi, statistiche, abilità, evoluzione e altro.',
  },
  es: {
    title: 'Poke Wordle - Adivina el Pokémon',
    description:
      '¡Pon a prueba tu conocimiento de Pokémon con Poke Wordle! Adivina el Pokémon basándote en sus atributos, estadísticas, habilidades, evolución y más.',
  },
  ko: {
    title: '포케 워들 - 포켓몬 맞추기 게임',
    description:
      '포케 워들로 포켓몬 지식을 테스트해보세요! 속성, 스탯, 특성, 진화 등을 바탕으로 포켓몬을 맞춰보세요.',
  },
  'zh-hans': {
    title: '宝可梦猜猜乐 - 猜宝可梦游戏',
    description:
      '用宝可梦猜猜乐测试你的宝可梦知识！根据属性、数值、特性、进化等信息猜出宝可梦。',
  },
  'zh-hant': {
    title: '寶可夢猜猜樂 - 猜寶可夢遊戲',
    description:
      '用寶可夢猜猜樂測試你的寶可夢知識！根據屬性、數值、特性、進化等資訊猜出寶可夢。',
  },
} satisfies Record<SiteLocale, { title: string; description: string }>;

export const privacyMetadata = {
  en: {
    title: 'Privacy Policy & Terms - Poke Wordle',
    description: 'Read our privacy policy and terms of service for Poke Wordle. Learn how we protect your data, what we collect, and our game usage policies. Your privacy matters to us.',
  },
  ja: {
    title: 'プライバシーポリシーと利用規約 - ポケワードル',
    description: 'ポケワードルのプライバシーポリシーと利用規約をお読みください。データ保護、収集情報、ゲーム利用ポリシーについて説明します。プライバシーを重視しています。',
  },
  fr: {
    title: 'Politique de Confidentialité et Conditions - Poke Wordle',
    description: 'Consultez notre politique de confidentialité et nos conditions d\'utilisation pour Poke Wordle. Découvrez comment nous protégeons vos données et nos politiques d\'utilisation.',
  },
  de: {
    title: 'Datenschutz & Nutzungsbedingungen - Poke Wordle',
    description: 'Lesen Sie unsere Datenschutzerklärung und Nutzungsbedingungen für Poke Wordle. Erfahren Sie, wie wir Ihre Daten schützen und unsere Nutzungsrichtlinien.',
  },
  it: {
    title: 'Privacy e Termini di Servizio - Poke Wordle',
    description: 'Leggi la nostra informativa sulla privacy e i termini di servizio per Poke Wordle. Scopri come proteggiamo i tuoi dati e le nostre politiche di utilizzo.',
  },
  es: {
    title: 'Privacidad y Términos de Servicio - Poke Wordle',
    description: 'Lee nuestra política de privacidad y términos de servicio para Poke Wordle. Conoce cómo protegemos tus datos y nuestras políticas de uso del juego.',
  },
  ko: {
    title: '개인정보 처리방침 및 이용약관 - 포케 워들',
    description: '포케 워들의 개인정보 처리방침과 이용약관을 확인하세요. 데이터 보호 방법과 게임 이용 정책에 대해 알아보세요. 개인정보 보호를 중시합니다.',
  },
  'zh-hans': {
    title: '隐私政策与服务条款 - 宝可梦猜猜乐',
    description: '阅读宝可梦猜猜乐的隐私政策和服务条款。了解我们如何保护您的数据、收集的信息以及游戏使用政策。我们重视您的隐私。',
  },
  'zh-hant': {
    title: '隱私政策與服務條款 - 寶可夢猜猜樂',
    description: '閱讀寶可夢猜猜樂的隱私政策和服務條款。了解我們如何保護您的資料、收集的資訊以及遊戲使用政策。我們重視您的隱私。',
  },
} satisfies Record<SiteLocale, { title: string; description: string }>;
