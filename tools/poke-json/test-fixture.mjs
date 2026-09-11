import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export async function createFixture() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'poke-review-'));
  const tool = path.join(dir, 'tools/poke-json'); const data = path.join(dir, 'src/data');
  await fs.mkdir(tool, { recursive: true }); await fs.mkdir(data, { recursive: true });
  const originalTool = new URL('./', import.meta.url);
  const names = (await fs.readdir(originalTool)).filter((file) => file.endsWith('.go') || ['go.mod', 'go.sum', 'corrections.json', 'id-registry.json', 'pipeline.mjs', 'review-state.mjs', 'console-model.mjs', 'console.mjs'].includes(file));
  for (const name of names) await fs.copyFile(new URL(name, originalTool), path.join(tool, name));
  await fs.cp(new URL('./console', import.meta.url), path.join(tool, 'console'), { recursive: true });
  const dataFiles = ['pokemon_data.json', 'pokemon_i18n.json', 'prankster_profile.json'];
  for (const name of [...dataFiles, 'dataset.json', 'knowledge_data.json']) await fs.copyFile(new URL(`../../src/data/${name}`, import.meta.url), path.join(data, name));
  await fs.cp(new URL('../../src/messages', import.meta.url), path.join(dir, 'src/messages'), { recursive: true });
  const run = path.join(tool, 'output/runs/fixture'); await fs.mkdir(path.join(run, 'cache'), { recursive: true });
  await fs.mkdir(path.join(run, 'output'));
  for (const name of dataFiles) await fs.copyFile(path.join(data, name), path.join(run, 'output', name));
  await fs.copyFile(path.join(tool, 'id-registry.json'), path.join(run, 'id-registry.json'));
  await fs.writeFile(path.join(run, 'translation-events.json'), '[]');
  const translationFile = path.join(run, 'output/pokemon_i18n.json');
  const translations = JSON.parse(await fs.readFile(translationFile));
  translations.bulbasaur.en = 'Updated fixture name';
  await fs.writeFile(translationFile, JSON.stringify(translations));
  const hash = (value) => createHash('sha256').update(value).digest('hex');
  const fileHash = async (file) => hash(await fs.readFile(file));
  const hashes = async (folder, entries) => Object.fromEntries(await Promise.all(entries.map(async (name) => [name, await fileHash(path.join(folder, name))])));
  const sourceFile = path.join(run, 'cache/fixture.json'); const fetchedAt = '2026-09-11T00:00:00Z';
  await fs.writeFile(sourceFile, JSON.stringify({ url: 'https://pokeapi.co/api/v2/pokemon-species/1/', fetched_at: fetchedAt, sha256: hash('{}'), body: {} }));
  const manifest = { schema: 1, id: 'fixture', completed_at: fetchedAt, baseline: await hashes(data, [...dataFiles, 'dataset.json']), baseline_registry: await fileHash(path.join(tool, 'id-registry.json')), generator: await hashes(tool, names.filter((file) => file.endsWith('.go') || ['go.mod', 'go.sum', 'corrections.json'].includes(file)).sort()), candidate: await hashes(path.join(run, 'output'), dataFiles), registry: await fileHash(path.join(run, 'id-registry.json')), translation_events: await fileHash(path.join(run, 'translation-events.json')), sources: [{ file: 'fixture.json', url: 'https://pokeapi.co/api/v2/pokemon-species/1/', fetched_at: fetchedAt, response_sha256: hash('{}'), cache_sha256: await fileHash(sourceFile) }] };
  await fs.writeFile(path.join(run, 'manifest.json'), JSON.stringify(manifest));
  const execute = (...args) => execFileSync(process.execPath, [path.join(tool, 'pipeline.mjs'), ...args], { stdio: 'pipe' });
  return { dir, tool, data, run, translationFile, sourceFile, manifest, execute, fileHash, cleanup: () => fs.rm(dir, { recursive: true, force: true }) };
}
