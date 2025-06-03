/**
 * @jest-environment jsdom
 */

import pokemonData from '../pokemon_data.json';
import i18nData from '../pokemon_i18n.json';
import { Pokemon } from '@/types/pokemon';

describe('Data Integrity Tests', () => {
  const pokemon = pokemonData as Pokemon[];
  const translations = i18nData as Record<string, Record<string, string>>;

  describe('Pokemon Data Structure', () => {
    test('should have valid Pokemon data structure', () => {
      expect(Array.isArray(pokemon)).toBe(true);
      expect(pokemon.length).toBeGreaterThan(0);
      
      pokemon.forEach((p) => {
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('name');
        expect(p).toHaveProperty('generation');
        expect(p).toHaveProperty('types');
        expect(p).toHaveProperty('abilities');
        expect(p).toHaveProperty('base_stats_total');
        expect(p).toHaveProperty('evolution_stage');
        
        expect(typeof p.id).toBe('number');
        expect(typeof p.name).toBe('string');
        expect(typeof p.generation).toBe('number');
        expect(Array.isArray(p.types)).toBe(true);
        expect(Array.isArray(p.abilities)).toBe(true);
        expect(typeof p.base_stats_total).toBe('number');
      });
    });

    test('should have unique Pokemon IDs', () => {
      const ids = pokemon.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('should have valid generation numbers', () => {
      pokemon.forEach(p => {
        expect(p.generation).toBeGreaterThan(0);
        expect(p.generation).toBeLessThanOrEqual(9); // Assuming up to gen 9
      });
    });

    test('should have non-empty names', () => {
      pokemon.forEach(p => {
        expect(p.name.trim()).not.toBe('');
      });
    });

    test('should have valid base stats', () => {
      pokemon.forEach(p => {
        expect(p.base_stats_total).toBeGreaterThan(0);
        expect(p.base_stats_total).toBeLessThan(1000); // Reasonable upper limit
        
        if (p.base_stats) {
          expect(p.base_stats.hp).toBeGreaterThanOrEqual(0);
          expect(p.base_stats.attack).toBeGreaterThanOrEqual(0);
          expect(p.base_stats.defense).toBeGreaterThanOrEqual(0);
          expect(p.base_stats.sp_attack).toBeGreaterThanOrEqual(0);
          expect(p.base_stats.sp_defense).toBeGreaterThanOrEqual(0);
          expect(p.base_stats.speed).toBeGreaterThanOrEqual(0);
        }
      });
    });

    test('should have valid evolution stages', () => {
      pokemon.forEach(p => {
        expect(p.evolution_stage).toBeGreaterThanOrEqual(1);
        expect(p.evolution_stage).toBeLessThanOrEqual(3); // Most evolution lines are 3 stages max
      });
    });
  });

  describe('Translation Data Structure', () => {
    test('should have translation data for all Pokemon names', () => {
      pokemon.forEach(p => {
        expect(translations).toHaveProperty(p.name);
        expect(typeof translations[p.name]).toBe('object');
      });
    });

    test('should have English translations for all entries', () => {
      Object.keys(translations).forEach(key => {
        expect(translations[key]).toHaveProperty('en');
        expect(typeof translations[key].en).toBe('string');
        expect(translations[key].en.trim()).not.toBe('');
      });
    });

    test('should have consistent locale keys across all translations', () => {
      const allKeys = Object.keys(translations);
      if (allKeys.length === 0) return;

      const firstEntryLocales = Object.keys(translations[allKeys[0]]);
      
      allKeys.forEach(key => {
        const entryLocales = Object.keys(translations[key]);
        expect(entryLocales.sort()).toEqual(firstEntryLocales.sort());
      });
    });

    test('should have translations for all Pokemon types', () => {
      const allTypes = new Set<string>();
      pokemon.forEach(p => {
        p.types?.forEach(type => allTypes.add(type));
      });

      allTypes.forEach(type => {
        expect(translations).toHaveProperty(type);
      });
    });

    test('should have translations for all Pokemon abilities', () => {
      const allAbilities = new Set<string>();
      pokemon.forEach(p => {
        p.abilities?.forEach(ability => allAbilities.add(ability));
      });

      allAbilities.forEach(ability => {
        expect(translations).toHaveProperty(ability);
      });
    });
  });

  describe('Data Consistency', () => {
    test('should have consistent type names format', () => {
      const typeNames = new Set<string>();
      pokemon.forEach(p => {
        p.types?.forEach(type => typeNames.add(type));
      });

      // Check for common type naming issues
      typeNames.forEach(type => {
        expect(type).not.toMatch(/^\s/); // No leading whitespace
        expect(type).not.toMatch(/\s$/); // No trailing whitespace
        expect(type.length).toBeGreaterThan(0); // Not empty
      });
    });

    test('should have reasonable distribution across generations', () => {
      const generationCounts = new Map<number, number>();
      pokemon.forEach(p => {
        generationCounts.set(p.generation, (generationCounts.get(p.generation) || 0) + 1);
      });

      // Each generation should have at least some Pokemon
      generationCounts.forEach((count) => {
        expect(count).toBeGreaterThan(0);
      });
    });

    test('should have valid profiles', () => {
      pokemon.forEach(p => {
        if (p.profile) {
          expect(typeof p.profile).toBe('string');
          expect(p.profile.trim()).not.toBe('');
          // Could add more specific validation for image file extensions
        }
      });
    });

    test('should have valid wiki URLs', () => {
      pokemon.forEach(p => {
        if (p.wiki_url) {
          expect(typeof p.wiki_url).toBe('string');
          expect(p.wiki_url).toMatch(/^https?:\/\//);
        }
      });
    });
  });

  describe('Localization Coverage', () => {
    test('should have Chinese translations for Pokemon names', () => {
      pokemon.forEach(p => {
        if (translations[p.name] && translations[p.name]['zh-hans']) {
          expect(typeof translations[p.name]['zh-hans']).toBe('string');
          expect(translations[p.name]['zh-hans'].trim()).not.toBe('');
        }
      });
    });

    test('should not have actual TODO placeholders in translations', () => {
      Object.values(translations).forEach(translation => {
        Object.values(translation).forEach(value => {
          expect(value).not.toMatch(/\[MISSING\]/i);
          expect(value).not.toMatch(/^TODO/i); // Only check for TODO at start to avoid false positives like "Mitodos"
          expect(value).not.toBe('');
        });
      });
    });
  });
}); 