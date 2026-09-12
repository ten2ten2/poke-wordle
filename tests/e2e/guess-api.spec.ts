import { test, expect } from '@playwright/test';
import { datasetVersion } from '../../src/config/dataset';
import pokemon from '../../src/data/pokemon_data.json';

const pikachu = pokemon.find((row) => row.name === 'pikachu')!;
const validGuess = {
  name: 'Pikachu',
  target_id: pikachu.id,
  dataset_version: datasetVersion,
};

test('guess API validates requests before comparing Pokemon', async ({ request }) => {
  const invalidBodies = [
    'null', '[]', '{}', '{',
    ...[
      { name: 25 },
      { name: '   ' },
      { target_id: String(pikachu.id) },
      { target_id: 0 },
      { is_prankster: 'false' },
      { is_gen_arrow: null },
      { locale: 'unknown' },
      { previousFieldToHide: {} },
    ].map((patch) => JSON.stringify({ ...validGuess, ...patch })),
  ];
  for (const data of invalidBodies) {
    const response = await request.post('/api/checkGuess', {
      data,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status(), data).toBe(400);
  }

  const stale = await request.post('/api/checkGuess', {
    data: { ...validGuess, dataset_version: 'old-dataset' },
  });
  expect(stale.status()).toBe(409);
  expect(await stale.json()).toMatchObject({ code: 'DATASET_CHANGED' });

  for (const patch of [{ name: 'unknown-pokemon' }, { target_id: Number.MAX_SAFE_INTEGER }]) {
    const response = await request.post('/api/checkGuess', { data: { ...validGuess, ...patch } });
    expect(response.status()).toBe(404);
  }
});

test('guess API resolves normalized names across cached language indexes', async ({ request }) => {
  for (const [locale, name] of [
    ['en', '  Ｐｉｋａｃｈｕ  '],
    ['ja', 'ﾋﾟｶﾁｭｳ'],
    ['zh-hans', '皮卡丘'],
    ['fr', 'PIKACHU'],
    ['en', 'pikachu'],
    ['ja', 'ピカチュウ'],
  ]) {
    const response = await request.post('/api/checkGuess', {
      data: { ...validGuess, locale, name },
    });
    expect(response.status(), `${locale}: ${name}`).toBe(200);
    expect(await response.json()).toMatchObject({ name: 'pikachu', isCorrect: true });
  }
});
