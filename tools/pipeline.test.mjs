import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createFixture } from './test-fixture.mjs';
import { reviewItems, changeDecisions } from './review-state.mjs';
import { semanticDiff, replaceBatch, validateDataset, locales } from './pipeline.mjs';

test('semantic comparison ignores collection order and null tags, but preserves type slots and identities', () => {
  const row = { name: 'fixture', id: 3, abilities: ['b', 'a'], tags: null, types: ['water', 'flying'] };
  assert.deepEqual(semanticDiff([row], [{ ...row, tags: [], abilities: ['a', 'b'] }], 'pokemon'), []);
  assert.deepEqual(semanticDiff([row], [{ ...row, id: 4, types: ['flying', 'water'] }], 'pokemon').map((diff) => diff.path), ['pokemon.fixture.id', 'pokemon.fixture.types']);
  const changes = semanticDiff([row], [{ ...row, name: 'new-form' }], 'pokemon');
  assert.deepEqual(changes.map((diff) => diff.kind), ['removed', 'added']);
  assert.deepEqual(semanticDiff(['b', 'a'], ['a', 'b'], 'images'), []);
  assert.equal(semanticDiff({ name: { en: 'Old' } }, { name: { en: 'New' } }, 'i18n')[0].path, 'i18n.name.en');
});

test('publication stages all files and restores every replaced file on I/O failure', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'poke-publication-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const a = path.join(dir, 'a.json'); const b = path.join(dir, 'b.json');
  await fs.writeFile(a, 'old-a'); await fs.writeFile(b, 'old-b');
  let count = 0;
  await assert.rejects(replaceBatch([[a, 'new-a'], [b, 'new-b']], async (...args) => {
    if (++count === 2) throw new Error('simulated disk failure');
    await fs.rename(...args);
  }), /simulated disk failure/);
  assert.equal(await fs.readFile(a, 'utf8'), 'old-a');
  assert.equal(await fs.readFile(b, 'utf8'), 'old-b');
  assert.deepEqual((await fs.readdir(dir)).sort(), ['a.json', 'b.json']);
  await assert.rejects(replaceBatch([[a, 'new-a'], [path.join(dir, 'missing/b.json'), 'new-b']]));
  assert.equal(await fs.readFile(a, 'utf8'), 'old-a');
  await replaceBatch([[a, 'new-a'], [b, 'new-b']]);
  assert.equal(await fs.readFile(b, 'utf8'), 'new-b');
});

test('validator rejects incomplete coverage, ID reuse, missing translations, and evolution regressions', async () => {
  const read = async (relative) => JSON.parse(await fs.readFile(new URL(relative, import.meta.url), 'utf8'));
  const data = await read('../src/data/pokemon_data.json');
  const translations = await read('../src/data/pokemon_i18n.json');
  const images = await read('../src/data/prankster_profile.json');
  const registry = await read('./id-registry.json');
  const messages = Object.fromEntries(await Promise.all(locales.map(async (locale) => [locale, await read(`../src/messages/${locale}.json`)])));
  const validate = (rows = data, names = translations, ids = registry) => validateDataset(rows, names, images, ids, messages);
  assert.equal(validate().species, 1025);
  assert.throws(() => validate(data.slice(1)), /覆盖不完整/);
  assert.throws(() => validate(data, translations, { ...registry, reserved: data[0].id }), /注册表 ID 无效/);
  assert.throws(() => validate(data, { ...translations, bulbasaur: { ...translations.bulbasaur, ja: '' } }), /翻译为空/);
  assert.throws(() => validate(data.map((row) => row.name === 'gallade' ? { ...row, evolution_method_detail: 'item-stone-dawn-female' } : row)), /进化修正回退/);
});

test('apply rejects changed candidates, baseline, sources and review; the reviewed batch succeeds', async (t) => {
  const fixture = await createFixture();
  t.after(fixture.cleanup);
  const { data, run, translationFile, sourceFile, manifest, execute, fileHash } = fixture;
  execute('review', 'fixture');
  const reportFile = path.join(run, 'review.json'); const reviewHash = await fileHash(reportFile);
  for (const [file, expected] of [[translationFile, '候选哈希'], [path.join(data, 'pokemon_data.json'), '基准已变化'], [sourceFile, '来源缓存'], [reportFile, '校对报告']]) {
    const before = await fs.readFile(file); await fs.appendFile(file, '\n');
    assert.throws(() => execute('apply', 'fixture', '--review', reviewHash), (error) => error.stderr.toString().includes(expected));
    await fs.writeFile(file, before);
  }
  assert.throws(() => execute('apply', 'fixture', '--review', reviewHash), (error) => error.stderr.toString().includes('待确认'));
  const report = JSON.parse(await fs.readFile(reportFile));
  const items = reviewItems(report);
  const approved = changeDecisions(items, null, reviewHash, items.filter((item) => item.requiresDecision).map((item) => ({ id: item.id, status: 'accepted' })), 0);
  await fs.writeFile(path.join(run, 'decisions.json'), JSON.stringify(approved));
  execute('apply', 'fixture', '--review', reviewHash);
  execute('verify');
  assert.equal(await fileHash(path.join(data, 'pokemon_i18n.json')), manifest.candidate['pokemon_i18n.json']);
});
