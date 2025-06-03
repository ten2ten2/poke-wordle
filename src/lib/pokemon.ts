import { Pokemon, ComparisonStatus, GuessResult } from '@/types/pokemon';

// Import data files
import pokeData from '@/data/pokemon_data.json';
import i18nData from '@/data/pokemon_i18n.json';
import pranksterProfileData from '@/data/prankster_profile.json';

export function loadPokemonData(): Pokemon[] {
  return pokeData as Pokemon[];
}

export function loadTranslationData(): Record<string, Record<string, string>> {
  return i18nData as Record<string, Record<string, string>>;
}

export function translateText(key: string, locale: string = 'en'): string {
  const translations = loadTranslationData();
  return translations[key]?.[locale] || key;
}

export function translatePokemon(pokemon: Pokemon, locale: string = 'en'): Pokemon {
  const translations = loadTranslationData();
  
  return {
    ...pokemon,
    name: translations[pokemon.name]?.[locale] || pokemon.name,
    types: pokemon.types?.map(type => translations[type]?.[locale] || type) || [],
    abilities: pokemon.abilities?.map(ability => translations[ability]?.[locale] || ability) || [],
    tags: pokemon.tags?.map(tag => translations[tag]?.[locale] || tag) || []
  };
}

export function loadPranksterProfiles(): string[] {
  return (pranksterProfileData as string[]) || [];
}

export function filterPokemonByGenerations(pokemon: Pokemon[], generations: number[]): Pokemon[] {
  return pokemon.filter(p => generations.indexOf(p.generation) !== -1);
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
      arrow: isGenArrow ? getGenerationArrow(guess.generation, target.generation) : undefined
    },
    types: (guess.types || []).map(type => ({
      value: type,
      status: (target.types || []).includes(type) ? 'exact' : 'nope'
    })),
    abilities: (guess.abilities || []).map(ability => ({
      value: ability,
      status: (target.abilities || []).includes(ability) ? 'exact' : 'nope'
    })),
    base_stats_total: {
      value: guess.base_stats_total,
      status: getStatsStatus(guess.base_stats_total, target.base_stats_total),
      arrow: getStatsArrow(guess.base_stats_total, target.base_stats_total)
    },
    evolution_stage: {
      value: guess.evolution_stage,
      status: guess.evolution_stage === target.evolution_stage ? 'exact' : 'nope'
    },
    evolution_method_detail: {
      value: guess.evolution_method_detail,
      status: getEvolutionStatus(guess, target)
    },
    tags: (guess.tags || []).map(tag => ({
      value: tag,
      status: (target.tags || []).includes(tag) ? 'exact' : 'nope'
    })),
    isCorrect: guess.id === target.id,
    fieldToHide: null
  };

  // Apply prankster effect
  if (isPrankster && !result.isCorrect) {
    applyPranksterEffect(result, previousFieldToHide);
  }

  return result;
}

function getGenerationStatus(guessGen: number, targetGen: number): ComparisonStatus {
  if (guessGen === targetGen) return 'exact';
  if (Math.abs(guessGen - targetGen) === 1) return 'close';
  return 'nope';
}

function getGenerationArrow(guessGen: number, targetGen: number): 'upper' | 'lower' | undefined {
  if (guessGen === targetGen) return undefined;
  return guessGen < targetGen ? 'upper' : 'lower';
}

function getStatsStatus(guessStats: number, targetStats: number): ComparisonStatus {
  if (guessStats === targetStats) return 'exact';
  if (Math.abs(guessStats - targetStats) <= 50) return 'close';
  return 'nope';
}

function getStatsArrow(guessStats: number, targetStats: number): 'upper' | 'lower' | undefined {
  if (guessStats === targetStats) return undefined;
  return guessStats < targetStats ? 'upper' : 'lower';
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

function applyPranksterEffect(result: GuessResult, previousFieldToHide: string | null): void {
  // List of fields that can be hidden
  const hidableFields = [
    'generation',
    'types',
    'abilities',
    'base_stats_total',
    'evolution_stage',
    'evolution_method_detail',
    'tags'
  ];

  // If the previous field to hide is not null, then we need to remove it from the list of hidable fields
  if (previousFieldToHide) {
    switch (previousFieldToHide) {
      case 'generation':
        hidableFields.splice(hidableFields.indexOf('generation'), 1);
        break;
      case 'types':
        hidableFields.splice(hidableFields.indexOf('types'), 1);
        break;
      case 'abilities':
        hidableFields.splice(hidableFields.indexOf('abilities'), 1);
        break;
      case 'base_stats':
        hidableFields.splice(hidableFields.indexOf('base_stats_total'), 1);
        break;
      case 'evolution':
        hidableFields.splice(hidableFields.indexOf('evolution_stage'), 1);
        hidableFields.splice(hidableFields.indexOf('evolution_method_detail'), 1);
        break;
      case 'tags':
        hidableFields.splice(hidableFields.indexOf('tags'), 1);
        break;
      default:
        break;
    }
  }

  // Hide a random column field
  const fieldToHide = hidableFields[Math.floor(Math.random() * hidableFields.length)];
  switch (fieldToHide) {
    case 'generation':
      result.fieldToHide = 'generation';
      break;
    case 'types':
      result.fieldToHide = 'types';
      break;
    case 'abilities':
      result.fieldToHide = 'abilities';
      break;
    case 'base_stats_total':
      result.fieldToHide = 'base_stats';
      break;
    case 'evolution_stage':
      result.fieldToHide = 'evolution';
      break;
    case 'evolution_method_detail':
      result.fieldToHide = 'evolution';
      break;
    case 'tags':
      result.fieldToHide = 'tags';
      break;
  }
}

export function getRandomPranksterImage(): string {
  const pranksterProfiles = loadPranksterProfiles();
  if (pranksterProfiles.length === 0) {
    return '';
  }
  return pranksterProfiles[Math.floor(Math.random() * pranksterProfiles.length)];
}

export function getWikiUrl(name: string, locale: string = 'en'): string {
  switch (locale) {
    case "en":
      name = name.replace(/ /g, "_")
      return `https://bulbapedia.bulbagarden.net/wiki/${name}`
    case "ja":
      name = name.trim()
      return `https://wiki.ポケモン.com/wiki/${name}`
    case "es":
      name = name.replace(/ /g, "_")
      return `https://www.wikidex.net/wiki/${name}`
    case "de":
      name = name.trim()
      return `https://www.pokewiki.de/${name}`
    case "it":
      name = name.replace(/ /g, "_")
      return `https://wiki.pokemoncentral.it/${name}`
    case "fr":
      name = name.replace(/ /g, "_")
      return `https://www.pokepedia.fr/${name}`
    case "zh-hant":
      name = name.trim()
      return `https://wiki.52poke.com/zh-hant/${name}`
    case "zh-hans":
      name = name.trim()
      return `https://wiki.52poke.com/zh-hans/${name}`
    case "ko":
      // Korean wiki is not available
      return ""
    default:
      return ""
  }
}