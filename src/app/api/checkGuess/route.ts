import { datasetVersion } from '@/config/dataset';
import { NextResponse, type NextRequest } from 'next/server';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { loadPokemonData, comparePokemon, normalizePokemonName, translateText } from '@/lib/pokemon';
import type { Pokemon } from '@/types/pokemon';

let index: {
  data: Pokemon[];
  ids: Map<number, Pokemon>;
  names: Map<string, Map<string, Pokemon>>;
} | undefined;

function pokemonIndex(locale: string) {
  const data = loadPokemonData();
  if (index?.data !== data) {
    index = { data, ids: new Map(data.map((row) => [row.id, row])), names: new Map() };
  }
  let names = index.names.get(locale);
  if (!names) {
    names = new Map();
    for (const row of data) {
      for (const name of [row.name, translateText(row.name, locale)]) {
        const key = normalizePokemonName(name);
        if (!names.has(key)) names.set(key, row);
      }
    }
    index.names.set(locale, names);
  }
  return { ids: index.ids, names };
}

// Compatibility for pages opened before guesses moved to the client.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { name, target_id, dataset_version, is_prankster = false, is_gen_arrow = false, locale = 'en', previousFieldToHide = null } = body;
    if (
      typeof name !== 'string' || !name.trim() || !Number.isSafeInteger(target_id) || target_id <= 0 ||
      typeof is_prankster !== 'boolean' || typeof is_gen_arrow !== 'boolean' ||
      !hasLocale(routing.locales, locale) ||
      (previousFieldToHide !== null && typeof previousFieldToHide !== 'string')
    ) {
      return NextResponse.json({ error: 'Invalid guess parameters' }, { status: 400 });
    }
    if (dataset_version !== datasetVersion) {
      return NextResponse.json({ error: 'Pokemon data updated', code: 'DATASET_CHANGED' }, { status: 409 });
    }

    const { ids, names } = pokemonIndex(locale);
    const guess = names.get(normalizePokemonName(name));
    if (!guess) return NextResponse.json({ error: 'Pokemon not found' }, { status: 404 });
    const target = ids.get(target_id);
    if (!target) return NextResponse.json({ error: 'Target Pokemon not found' }, { status: 404 });

    return NextResponse.json(comparePokemon(guess, target, is_prankster, is_gen_arrow, previousFieldToHide));
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }
    console.error('Error in checkGuess API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
