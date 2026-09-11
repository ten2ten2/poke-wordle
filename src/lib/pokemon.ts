import { Pokemon, ComparisonStatus, GuessResult } from '@/types/pokemon';

import pokeData from '@/data/pokemon_data.json';
import i18nData from '@/data/pokemon_i18n.json';
import pranksterProfileData from '@/data/prankster_profile.json';

export function loadPokemonData(): Pokemon[] {
  return pokeData as Pokemon[];
}

const translations: Record<string, Record<string, string>> = i18nData;

export function translateText(key: string, locale: string = 'en'): string {
  return translations[key]?.[locale] || key;
}

export function filterPokemonByGenerations(
  pokemon: Pokemon[],
  generations: number[],
): Pokemon[] {
  return pokemon.filter((p) => generations.includes(p.generation));
}

export function getRandomPokemon(pokemon: Pokemon[]): Pokemon {
  const randomIndex = Math.floor(Math.random() * pokemon.length);
  return pokemon[randomIndex];
}

export function comparePokemon(
  guess: Pokemon,
  target: Pokemon,
  isPrankster: boolean,
  isGenArrow: boolean,
  previousFieldToHide: string | null,
): GuessResult {
  const result: GuessResult = {
    name: guess.name,
    profile: guess.profile,
    generation: {
      value: guess.generation,
      status: getGenerationStatus(guess.generation, target.generation),
      arrow: isGenArrow
        ? getComparisonArrow(guess.generation, target.generation)
        : undefined,
    },
    types: (guess.types || []).map((type) => ({
      value: type,
      status: (target.types || []).includes(type) ? 'exact' : 'nope',
    })),
    abilities: (guess.abilities || []).map((ability) => ({
      value: ability,
      status: (target.abilities || []).includes(ability) ? 'exact' : 'nope',
    })),
    base_stats_total: {
      value: guess.base_stats_total,
      status: getStatsStatus(guess.base_stats_total, target.base_stats_total),
      arrow: getComparisonArrow(
        guess.base_stats_total,
        target.base_stats_total,
      ),
    },
    evolution_stage: {
      value: guess.evolution_stage,
      status:
        guess.evolution_stage === target.evolution_stage ? 'exact' : 'nope',
    },
    evolution_method_detail: {
      value: guess.evolution_method_detail,
      status: getEvolutionStatus(guess, target),
    },
    tags: (guess.tags || []).map((tag) => ({
      value: tag,
      status: (target.tags || []).includes(tag) ? 'exact' : 'nope',
    })),
    isCorrect: guess.id === target.id,
    fieldToHide: null,
  };

  // Apply prankster effect
  if (isPrankster && !result.isCorrect) {
    applyPranksterEffect(result, previousFieldToHide);
  }

  return result;
}

function getGenerationStatus(
  guessGen: number,
  targetGen: number,
): ComparisonStatus {
  if (guessGen === targetGen) return 'exact';
  if (Math.abs(guessGen - targetGen) === 1) return 'close';
  return 'nope';
}

function getComparisonArrow(
  guess: number,
  target: number,
): 'upper' | 'lower' | undefined {
  if (guess === target) return undefined;
  return guess < target ? 'upper' : 'lower';
}

function getStatsStatus(
  guessStats: number,
  targetStats: number,
): ComparisonStatus {
  if (guessStats === targetStats) return 'exact';
  if (Math.abs(guessStats - targetStats) <= 50) return 'close';
  return 'nope';
}

function getEvolutionStatus(guess: Pokemon, target: Pokemon): ComparisonStatus {
  if (guess.evolution_method === target.evolution_method) {
    if (guess.evolution_method_detail === target.evolution_method_detail) {
      return 'exact';
    } else {
      return 'close';
    }
  }
  return 'nope';
}

function applyPranksterEffect(
  result: GuessResult,
  previousFieldToHide: string | null,
): void {
  // Preserve the original weighting: either evolution field hides the same column.
  const fields = [
    'generation',
    'types',
    'abilities',
    'base_stats',
    'evolution',
    'evolution',
    'tags',
  ].filter((field) => field !== previousFieldToHide);
  result.fieldToHide = fields[Math.floor(Math.random() * fields.length)];
}

export function getRandomPranksterImage(): string {
  const pranksterProfiles = pranksterProfileData;
  if (pranksterProfiles.length === 0) {
    return '';
  }
  return pranksterProfiles[
    Math.floor(Math.random() * pranksterProfiles.length)
  ];
}

export function getWikiUrl(name: string, locale: string = 'en'): string {
  // Remove parentheses and content within them from the name
  name = name.replace(/\s*\([^)]*\)/g, '');

  switch (locale) {
    case 'en':
      name = name.replace(/ /g, '_');
      return `https://bulbapedia.bulbagarden.net/wiki/${name}`;
    case 'ja':
      name = name.trim();
      return `https://wiki.ポケモン.com/wiki/${name}`;
    case 'es':
      name = name.replace(/ /g, '_');
      return `https://www.wikidex.net/wiki/${name}`;
    case 'de':
      name = name.trim();
      return `https://www.pokewiki.de/${name}`;
    case 'it':
      name = name.replace(/ /g, '_');
      return `https://wiki.pokemoncentral.it/${name}`;
    case 'fr':
      name = name.replace(/ /g, '_');
      return `https://www.pokepedia.fr/${name}`;
    case 'zh-hant':
      name = name.trim();
      return `https://wiki.52poke.com/zh-hant/${name}`;
    case 'zh-hans':
      name = name.trim();
      return `https://wiki.52poke.com/zh-hans/${name}`;
    case 'ko':
      // Korean wiki is not available
      return '';
    default:
      return '';
  }
}
