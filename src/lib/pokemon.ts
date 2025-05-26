import { Pokemon, ComparisonStatus, GuessResult } from '@/types/pokemon';

export function loadPokemonData(locale: string): Pokemon[] {
  try {
    // Handle locale name mapping for file names
    let fileName = locale;
    if (locale === 'zh-hans') {
      fileName = 'zh-Hans';
    } else if (locale === 'zh-hant') {
      fileName = 'zh-Hant';
    }
    
    const data = require(`@/data/poke_data_${fileName}.json`);
    return data;
  } catch (error) {
    // Fallback to English if locale not found
    const data = require('@/data/poke_data_en.json');
    return data;
  }
}

export function loadPranksterProfiles(): string[] {
  try {
    const data = require('@/data/prankster_profile.json');
    return data;
  } catch (error) {
    return [];
  }
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
  isGenArrow: boolean
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
    applyPranksterEffect(result);
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

function applyPranksterEffect(result: GuessResult): void {
  const pranksterProfiles = loadPranksterProfiles();

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