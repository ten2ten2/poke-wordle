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
      speed: 45
    },
    evolution_stage: 1,
    evolution_method: 'level',
    evolution_method_detail: '16',
    tags: ['Starter', 'Quadruped'],
    wiki_url: 'https://bulbapedia.bulbagarden.net/wiki/Bulbasaur'
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
      speed: 60
    },
    evolution_stage: 2,
    evolution_method: 'level',
    evolution_method_detail: '32',
    tags: ['Quadruped'],
    wiki_url: 'https://bulbapedia.bulbagarden.net/wiki/Ivysaur'
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
      speed: 90
    },
    evolution_stage: 1,
    evolution_method: 'item',
    evolution_method_detail: 'Thunder Stone',
    tags: ['Bipedal', 'Mascot'],
    wiki_url: 'https://bulbapedia.bulbagarden.net/wiki/Pikachu'
  }
], { virtual: true });

jest.mock('@/data/pokemon_i18n.json', () => ({
  'Bulbasaur': { 'en': 'Bulbasaur', 'zh-hans': '妙蛙种子' },
  'Grass': { 'en': 'Grass', 'zh-hans': '草' },
  'Poison': { 'en': 'Poison', 'zh-hans': '毒' }
}), { virtual: true });

// Now import the functions after mocking
import { 
  filterPokemonByGenerations, 
  getRandomPokemon, 
  translatePokemon, 
  comparePokemon,
  translateText 
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
      speed: 45
    },
    evolution_stage: 1,
    evolution_method: 'level',
    evolution_method_detail: '16',
    tags: ['Starter', 'Quadruped'],
    wiki_url: 'https://bulbapedia.bulbagarden.net/wiki/Bulbasaur'
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
      speed: 60
    },
    evolution_stage: 2,
    evolution_method: 'level',
    evolution_method_detail: '32',
    tags: ['Quadruped'],
    wiki_url: 'https://bulbapedia.bulbagarden.net/wiki/Ivysaur'
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
      speed: 90
    },
    evolution_stage: 1,
    evolution_method: 'item',
    evolution_method_detail: 'Thunder Stone',
    tags: ['Bipedal', 'Mascot'],
    wiki_url: 'https://bulbapedia.bulbagarden.net/wiki/Pikachu'
  }
];

describe('pokemon.ts', () => {
  describe('filterPokemonByGenerations', () => {
    it('should filter Pokemon by selected generations', () => {
      const result = filterPokemonByGenerations(mockPokemon, [1]);
      expect(result).toHaveLength(3);
      expect(result.every(p => p.generation === 1)).toBe(true);
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

  describe('translatePokemon', () => {
    it('should translate Pokemon name to target locale', () => {
      const result = translatePokemon(mockPokemon[0], 'zh-hans');
      expect(result.name).toBe('妙蛙种子');
    });

    it('should translate Pokemon types', () => {
      const result = translatePokemon(mockPokemon[0], 'zh-hans');
      expect(result.types).toContain('草');
      expect(result.types).toContain('毒');
    });

    it('should fallback to original text if translation not found', () => {
      const result = translatePokemon(mockPokemon[0], 'fr');
      expect(result.name).toBe('Bulbasaur');
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
      const result = comparePokemon(targetPokemon, targetPokemon, false, false, null);
      expect(result.isCorrect).toBe(true);
      expect(result.generation.status).toBe('exact');
      expect(result.types.every(t => t.status === 'exact')).toBe(true);
    });

    it('should return correct comparison for different Pokemon', () => {
      const result = comparePokemon(guessPokemon, targetPokemon, false, false, null);
      expect(result.isCorrect).toBe(false);
      expect(result.generation.status).toBe('exact'); // Same generation
      expect(result.types.every(t => t.status === 'exact')).toBe(true); // Same types
    });

    it('should show generation arrows when isGenArrow is true', () => {
      const pikachuVsBulbasaur = comparePokemon(mockPokemon[2], targetPokemon, false, true, null);
      expect(pikachuVsBulbasaur.generation.arrow).toBeUndefined(); // Same generation
    });

    it('should calculate stats comparison correctly', () => {
      const result = comparePokemon(guessPokemon, targetPokemon, false, false, null);
      expect(result.base_stats_total.status).toBe('nope'); // 405 vs 318, difference > 50
      expect(result.base_stats_total.arrow).toBe('lower'); // 405 > 318
    });

    it('should handle evolution stage comparison', () => {
      const result = comparePokemon(guessPokemon, targetPokemon, false, false, null);
      expect(result.evolution_stage.status).toBe('nope'); // 2 vs 1
    });

    it('should handle evolution method comparison', () => {
      const pikachu = mockPokemon[2];
      const result = comparePokemon(pikachu, targetPokemon, false, false, null);
      expect(result.evolution_method_detail.status).toBe('nope'); // 'Thunder Stone' vs '16'
    });

    it('should apply prankster effect when enabled', () => {
      const result = comparePokemon(guessPokemon, targetPokemon, true, false, null);
      expect(result.fieldToHide).not.toBeNull();
    });
  });
}); 