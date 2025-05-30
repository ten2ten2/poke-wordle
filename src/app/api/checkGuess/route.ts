import { NextRequest, NextResponse } from 'next/server';
import { loadPokemonData, comparePokemon } from '@/lib/pokemon';

export async function POST(request: NextRequest) {
  try {
    const { name, target_id, is_prankster, is_gen_arrow, locale = 'en', previousFieldToHide = null } = await request.json();

    if (!name || !target_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Load Pokemon data for the specified locale
    const pokemonData = loadPokemonData(locale);

    // Find the guessed Pokemon
    const guessPokemon = pokemonData.find(
      p => p.name.toLowerCase() === name.toLowerCase()
    );

    if (!guessPokemon) {
      return NextResponse.json(
        { error: 'Pokemon not found' },
        { status: 404 }
      );
    }

    // Find the target Pokemon
    const targetPokemon = pokemonData.find(p => p.id === target_id);

    if (!targetPokemon) {
      return NextResponse.json(
        { error: 'Target Pokemon not found' },
        { status: 404 }
      );
    }

    // Compare the Pokemon
    const result = comparePokemon(
      guessPokemon,
      targetPokemon,
      is_prankster || false,
      is_gen_arrow || false,
      previousFieldToHide,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in checkGuess API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 