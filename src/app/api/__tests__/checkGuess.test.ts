/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../checkGuess/route';

// Mock the Pokemon library functions first
jest.mock('@/lib/pokemon', () => ({
  loadPokemonData: jest.fn(),
  translatePokemon: jest.fn(),
  comparePokemon: jest.fn()
}));

import * as pokemonLib from '@/lib/pokemon';

// Mock Pokemon data
const mockPokemon = {
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
  tags: ['Starter']
};

const mockGuessResult = {
  name: 'Bulbasaur',
  profile: 'bulbasaur.png',
  generation: { value: 1, status: 'exact' as const },
  types: [{ value: 'Grass', status: 'exact' as const }],
  abilities: [{ value: 'Overgrow', status: 'exact' as const }],
  base_stats_total: { value: 318, status: 'exact' as const },
  evolution_stage: { value: 1, status: 'exact' as const },
  evolution_method_detail: { value: '16', status: 'exact' as const },
  tags: [{ value: 'Starter', status: 'exact' as const }],
  isCorrect: true,
  fieldToHide: null
};

// Mock the pokemon library
const mockLoadPokemonData = pokemonLib.loadPokemonData as jest.MockedFunction<typeof pokemonLib.loadPokemonData>;
const mockTranslatePokemon = pokemonLib.translatePokemon as jest.MockedFunction<typeof pokemonLib.translatePokemon>;
const mockComparePokemon = pokemonLib.comparePokemon as jest.MockedFunction<typeof pokemonLib.comparePokemon>;

describe('/api/checkGuess', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Configure mock implementations
    mockLoadPokemonData.mockReturnValue([mockPokemon]);
    mockTranslatePokemon.mockImplementation((pokemon) => pokemon);
    mockComparePokemon.mockReturnValue(mockGuessResult);
  });

  test('should return comparison result for valid request', async () => {
    const requestBody = {
      name: 'Bulbasaur',
      target_id: 1,
      is_prankster: false,
      is_gen_arrow: false,
      previousFieldToHide: null,
      locale: 'en'
    };

    const request = new NextRequest('http://localhost:3000/api/checkGuess', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockGuessResult);
    expect(mockComparePokemon).toHaveBeenCalledWith(
      mockPokemon,
      mockPokemon,
      false,
      false,
      null
    );
  });

  test('should return 400 for invalid guess name', async () => {
    const requestBody = {
      name: 'InvalidPokemon',
      target_id: 1,
      is_prankster: false,
      is_gen_arrow: false,
      previousFieldToHide: null,
      locale: 'en'
    };

    const request = new NextRequest('http://localhost:3000/api/checkGuess', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Pokemon not found');
  });

  test('should return 400 for invalid target Pokemon ID', async () => {
    const requestBody = {
      name: 'Bulbasaur',
      target_id: 999,
      is_prankster: false,
      is_gen_arrow: false,
      previousFieldToHide: null,
      locale: 'en'
    };

    const request = new NextRequest('http://localhost:3000/api/checkGuess', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Target Pokemon not found');
  });

  test('should return 400 for missing request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/checkGuess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  test('should handle prankster mode', async () => {
    const requestBody = {
      name: 'Bulbasaur',
      target_id: 1,
      is_prankster: true,
      is_gen_arrow: false,
      previousFieldToHide: 'types',
      locale: 'en'
    };

    const request = new NextRequest('http://localhost:3000/api/checkGuess', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    expect(mockComparePokemon).toHaveBeenCalledWith(
      mockPokemon,
      mockPokemon,
      true,
      false,
      'types'
    );
  });

  test('should handle generation arrow mode', async () => {
    const requestBody = {
      name: 'Bulbasaur',
      target_id: 1,
      is_prankster: false,
      is_gen_arrow: true,
      previousFieldToHide: null,
      locale: 'en'
    };

    const request = new NextRequest('http://localhost:3000/api/checkGuess', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    expect(mockComparePokemon).toHaveBeenCalledWith(
      mockPokemon,
      mockPokemon,
      false,
      true,
      null
    );
  });
}); 