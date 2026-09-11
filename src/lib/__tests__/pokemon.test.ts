/**
 * @jest-environment jsdom
 */

import { Pokemon } from '@/types/pokemon';

// Mock the data modules first before any variable definitions
jest.mock('@/data/pokemon_data.json', () => [
  {
    id: 1,
    pokedex_id_national: 1,
    name: 'Bulbasaur',
    profile: 'bulbasaur.png',
    generation: 1,
    types: ['Grass', 'Poison'],
    abilities: ['Overgrow', 'Chlorophyll'],
    base_stats_total: 318,
    base_stats: {
      attack: 49,
      defense: 49,
      hp: 45,
      sp_attack: 65,
      sp_defense: 65,
      speed: 45,
    },
    evolution_stage: 1,
    evolution_method: 'level',
    evolution_method_detail: '16',
    tags: ['Starter', 'Quadruped'],
  },
  {
    id: 2,
    pokedex_id_national: 2,
    name: 'Ivysaur',
    profile: 'ivysaur.png',
    generation: 1,
    types: ['Grass', 'Poison'],
    abilities: ['Overgrow', 'Chlorophyll'],
    base_stats_total: 405,
    base_stats: {
      attack: 62,
      defense: 63,
      hp: 60,
      sp_attack: 80,
      sp_defense: 80,
      speed: 60,
    },
    evolution_stage: 2,
    evolution_method: 'level',
    evolution_method_detail: '32',
    tags: ['Quadruped'],
  },
  {
    id: 25,
    pokedex_id_national: 25,
    name: 'Pikachu',
    profile: 'pikachu.png',
    generation: 1,
    types: ['Electric'],
    abilities: ['Static', 'Lightning Rod'],
    base_stats_total: 320,
    base_stats: {
      attack: 55,
      defense: 40,
      hp: 35,
      sp_attack: 50,
      sp_defense: 50,
      speed: 90,
    },
    evolution_stage: 1,
    evolution_method: 'item',
    evolution_method_detail: 'Thunder Stone',
    tags: ['Bipedal', 'Mascot'],
  },
]);

jest.mock('@/data/pokemon_i18n.json', () => ({
  Bulbasaur: { en: 'Bulbasaur', 'zh-hans': '妙蛙种子' },
  Grass: { en: 'Grass', 'zh-hans': '草' },
  Poison: { en: 'Poison', 'zh-hans': '毒' },
}));

// Now import the functions after mocking
import {
  filterPokemonByGenerations,
  getRandomPokemon,
  comparePokemon,
  translateText,
  getWikiUrl,
} from '../pokemon';

// Mock data for tests (duplicate data for test reference)
const mockPokemon: Pokemon[] = [
  {
    id: 1,
    pokedex_id_national: 1,
    name: 'Bulbasaur',
    profile: 'bulbasaur.png',
    generation: 1,
    types: ['Grass', 'Poison'],
    abilities: ['Overgrow', 'Chlorophyll'],
    base_stats_total: 318,
    base_stats: {
      attack: 49,
      defense: 49,
      hp: 45,
      sp_attack: 65,
      sp_defense: 65,
      speed: 45,
    },
    evolution_stage: 1,
    evolution_method: 'level',
    evolution_method_detail: '16',
    tags: ['Starter', 'Quadruped'],
  },
  {
    id: 2,
    pokedex_id_national: 2,
    name: 'Ivysaur',
    profile: 'ivysaur.png',
    generation: 1,
    types: ['Grass', 'Poison'],
    abilities: ['Overgrow', 'Chlorophyll'],
    base_stats_total: 405,
    base_stats: {
      attack: 62,
      defense: 63,
      hp: 60,
      sp_attack: 80,
      sp_defense: 80,
      speed: 60,
    },
    evolution_stage: 2,
    evolution_method: 'level',
    evolution_method_detail: '32',
    tags: ['Quadruped'],
  },
  {
    id: 25,
    pokedex_id_national: 25,
    name: 'Pikachu',
    profile: 'pikachu.png',
    generation: 1,
    types: ['Electric'],
    abilities: ['Static', 'Lightning Rod'],
    base_stats_total: 320,
    base_stats: {
      attack: 55,
      defense: 40,
      hp: 35,
      sp_attack: 50,
      sp_defense: 50,
      speed: 90,
    },
    evolution_stage: 1,
    evolution_method: 'item',
    evolution_method_detail: 'Thunder Stone',
    tags: ['Bipedal', 'Mascot'],
  },
];

describe('pokemon.ts', () => {
  describe('filterPokemonByGenerations', () => {
    it('should filter Pokemon by selected generations', () => {
      const result = filterPokemonByGenerations(mockPokemon, [1]);
      expect(result).toHaveLength(3);
      expect(result.every((p) => p.generation === 1)).toBe(true);
    });

    it('should return empty array for non-existent generation', () => {
      const result = filterPokemonByGenerations(mockPokemon, [9]);
      expect(result).toHaveLength(0);
    });

    it('should handle multiple generations', () => {
      const result = filterPokemonByGenerations(mockPokemon, [1, 2]);
      expect(result).toHaveLength(3);
    });
  });

  describe('getRandomPokemon', () => {
    it('should return a Pokemon from the array', () => {
      const result = getRandomPokemon(mockPokemon);
      expect(mockPokemon).toContain(result);
    });

    it('should return different Pokemon on multiple calls', () => {
      // Note: This test might occasionally fail due to randomness
      // In practice, you might want to mock Math.random for deterministic tests
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        results.add(getRandomPokemon(mockPokemon).id);
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('translateText', () => {
    it('should translate text to target locale', () => {
      const result = translateText('Bulbasaur', 'zh-hans');
      expect(result).toBe('妙蛙种子');
    });

    it('should return original key if translation not found', () => {
      const result = translateText('NonExistent', 'zh-hans');
      expect(result).toBe('NonExistent');
    });
  });

  describe('comparePokemon', () => {
    const targetPokemon = mockPokemon[0]; // Bulbasaur
    const guessPokemon = mockPokemon[1]; // Ivysaur

    it('should return correct comparison for exact match', () => {
      const result = comparePokemon(
        targetPokemon,
        targetPokemon,
        false,
        false,
        null,
      );
      expect(result.isCorrect).toBe(true);
      expect(result.generation.status).toBe('exact');
      expect(result.types.every((t) => t.status === 'exact')).toBe(true);
    });

    it('should return correct comparison for different Pokemon', () => {
      const result = comparePokemon(
        guessPokemon,
        targetPokemon,
        false,
        false,
        null,
      );
      expect(result.isCorrect).toBe(false);
      expect(result.generation.status).toBe('exact'); // Same generation
      expect(result.types.every((t) => t.status === 'exact')).toBe(true); // Same types
    });

    it('should show generation arrows when isGenArrow is true', () => {
      const pikachuVsBulbasaur = comparePokemon(
        mockPokemon[2],
        targetPokemon,
        false,
        true,
        null,
      );
      expect(pikachuVsBulbasaur.generation.arrow).toBeUndefined(); // Same generation
    });

    it('should calculate stats comparison correctly', () => {
      const result = comparePokemon(
        guessPokemon,
        targetPokemon,
        false,
        false,
        null,
      );
      expect(result.base_stats_total.status).toBe('nope'); // 405 vs 318, difference > 50
      expect(result.base_stats_total.arrow).toBe('lower'); // 405 > 318
    });

    it('should handle evolution stage comparison', () => {
      const result = comparePokemon(
        guessPokemon,
        targetPokemon,
        false,
        false,
        null,
      );
      expect(result.evolution_stage.status).toBe('nope'); // 2 vs 1
    });

    it('should handle evolution method comparison', () => {
      const pikachu = mockPokemon[2];
      const result = comparePokemon(pikachu, targetPokemon, false, false, null);
      expect(result.evolution_method_detail.status).toBe('nope'); // 'Thunder Stone' vs '16'
    });

    it('should apply prankster effect when enabled', () => {
      const result = comparePokemon(
        guessPokemon,
        targetPokemon,
        true,
        false,
        null,
      );
      expect(result.fieldToHide).not.toBeNull();
    });
  });

  describe('getWikiUrl', () => {
    it('should generate correct wiki URLs for Mr. Mime in all languages', () => {
      // English
      expect(getWikiUrl('Mr. Mime', 'en')).toBe(
        'https://bulbapedia.bulbagarden.net/wiki/Mr._Mime',
      );

      // Japanese
      expect(getWikiUrl('バリヤード', 'ja')).toBe(
        'https://wiki.ポケモン.com/wiki/バリヤード',
      );

      // Spanish
      expect(getWikiUrl('Mr. Mime', 'es')).toBe(
        'https://www.wikidex.net/wiki/Mr._Mime',
      );

      // German
      expect(getWikiUrl('Pantimos', 'de')).toBe(
        'https://www.pokewiki.de/Pantimos',
      );

      // Italian
      expect(getWikiUrl('Mr. Mime', 'it')).toBe(
        'https://wiki.pokemoncentral.it/Mr._Mime',
      );

      // French
      expect(getWikiUrl('M. Mime', 'fr')).toBe(
        'https://www.pokepedia.fr/M._Mime',
      );

      // Chinese Traditional
      expect(getWikiUrl('魔牆人偶', 'zh-hant')).toBe(
        'https://wiki.52poke.com/zh-hant/魔牆人偶',
      );

      // Chinese Simplified
      expect(getWikiUrl('魔墙人偶', 'zh-hans')).toBe(
        'https://wiki.52poke.com/zh-hans/魔墙人偶',
      );

      // Korean (no wiki available)
      expect(getWikiUrl('마임맨', 'ko')).toBe('');
    });

    it('should generate correct wiki URLs for Tapu Koko in all languages', () => {
      // English
      expect(getWikiUrl('Tapu Koko', 'en')).toBe(
        'https://bulbapedia.bulbagarden.net/wiki/Tapu_Koko',
      );

      // Japanese
      expect(getWikiUrl('カプ・コケコ', 'ja')).toBe(
        'https://wiki.ポケモン.com/wiki/カプ・コケコ',
      );

      // Spanish
      expect(getWikiUrl('Tapu Koko', 'es')).toBe(
        'https://www.wikidex.net/wiki/Tapu_Koko',
      );

      // German
      expect(getWikiUrl('Kapu-Riki', 'de')).toBe(
        'https://www.pokewiki.de/Kapu-Riki',
      );

      // Italian
      expect(getWikiUrl('Tapu Koko', 'it')).toBe(
        'https://wiki.pokemoncentral.it/Tapu_Koko',
      );

      // French
      expect(getWikiUrl('Tokorico', 'fr')).toBe(
        'https://www.pokepedia.fr/Tokorico',
      );

      // Chinese Traditional
      expect(getWikiUrl('卡璞・鳴鳴', 'zh-hant')).toBe(
        'https://wiki.52poke.com/zh-hant/卡璞・鳴鳴',
      );

      // Chinese Simplified
      expect(getWikiUrl('卡璞・鸣鸣', 'zh-hans')).toBe(
        'https://wiki.52poke.com/zh-hans/卡璞・鸣鸣',
      );

      // Korean (no wiki available)
      expect(getWikiUrl('카푸꼬꼬꼭', 'ko')).toBe('');
    });

    it('should generate correct wiki URLs for Shaymin (Sky Forme) in all languages', () => {
      // English
      expect(getWikiUrl('Shaymin (Sky Forme)', 'en')).toBe(
        'https://bulbapedia.bulbagarden.net/wiki/Shaymin',
      );

      // Japanese
      expect(getWikiUrl('シェイミ (スカイフォルム)', 'ja')).toBe(
        'https://wiki.ポケモン.com/wiki/シェイミ',
      );

      // Spanish
      expect(getWikiUrl('Shaymin (Forma Cielo)', 'es')).toBe(
        'https://www.wikidex.net/wiki/Shaymin',
      );

      // German
      expect(getWikiUrl('Shaymin (Zenitform)', 'de')).toBe(
        'https://www.pokewiki.de/Shaymin',
      );

      // Italian
      expect(getWikiUrl('Shaymin (Forma Cielo)', 'it')).toBe(
        'https://wiki.pokemoncentral.it/Shaymin',
      );

      // French
      expect(getWikiUrl('Shaymin (Forme Céleste)', 'fr')).toBe(
        'https://www.pokepedia.fr/Shaymin',
      );

      // Chinese Traditional
      expect(getWikiUrl('謝米 (天空形態)', 'zh-hant')).toBe(
        'https://wiki.52poke.com/zh-hant/謝米',
      );

      // Chinese Simplified
      expect(getWikiUrl('谢米 (天空形态)', 'zh-hans')).toBe(
        'https://wiki.52poke.com/zh-hans/谢米',
      );

      // Korean (no wiki available)
      expect(getWikiUrl('쉐이미 (스카이폼)', 'ko')).toBe('');
    });

    it('should handle names with spaces and special characters', () => {
      // Test space replacement for English
      expect(getWikiUrl('Mr. Mime', 'en')).toBe(
        'https://bulbapedia.bulbagarden.net/wiki/Mr._Mime',
      );

      // Test space replacement for Spanish
      expect(getWikiUrl('Tapu Koko', 'es')).toBe(
        'https://www.wikidex.net/wiki/Tapu_Koko',
      );

      // Test no space replacement for Japanese (trim only)
      expect(getWikiUrl('カプ・コケコ', 'ja')).toBe(
        'https://wiki.ポケモン.com/wiki/カプ・コケコ',
      );

      // Test no space replacement for Chinese (trim only)
      expect(getWikiUrl('卡璞・鳴鳴', 'zh-hant')).toBe(
        'https://wiki.52poke.com/zh-hant/卡璞・鳴鳴',
      );
    });

    it('should return empty string for unsupported locales', () => {
      expect(getWikiUrl('Mr. Mime', 'pt')).toBe('');
      expect(getWikiUrl('Tapu Koko', 'ru')).toBe('');
      expect(getWikiUrl('Test', 'unknown')).toBe('');
    });

    it('should handle default locale parameter', () => {
      // Should default to English when no locale is provided
      expect(getWikiUrl('Mr. Mime')).toBe(
        'https://bulbapedia.bulbagarden.net/wiki/Mr._Mime',
      );
      expect(getWikiUrl('Tapu Koko')).toBe(
        'https://bulbapedia.bulbagarden.net/wiki/Tapu_Koko',
      );
    });
  });
});
