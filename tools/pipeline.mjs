import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { assertApproved, withDecisionLock } from './review-state.mjs';

const tool = import.meta.dirname;
const root = path.resolve(tool, '..');
const published = path.join(root, 'src/data');
const runs = path.join(tool, 'output/runs');
export const files = ['pokemon_data.json', 'pokemon_i18n.json', 'prankster_profile.json'];
export const locales = ['en', 'ja', 'es', 'de', 'it', 'fr', 'zh-hans', 'zh-hant', 'ko'];
const registryFile = path.join(tool, 'id-registry.json');
export const paths = { tool, root, published, runs, registryFile };
const hash = (value) => createHash('sha256').update(value).digest('hex');
const readJSON = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const fileHash = async (file) => hash(await fs.readFile(file));
const hashes = async (dir, names = files) => Object.fromEntries(await Promise.all(names.map(async (name) => [name, await fileHash(path.join(dir, name))])));
const writeJSON = (file, value) => fs.writeFile(file, json(value), { flag: 'wx' });
const equal = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const runPath = (id) => {
  assert.match(id ?? '', /^[\w-]+$/, '需要有效的 run-id');
  return path.join(runs, id);
};
function canonical(value, field = '') {
  if (field === 'tags' || field === 'abilities') return [...new Set(value ?? [])].sort();
  if (Array.isArray(value)) return value.map((item) => canonical(item));
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key], key)]));
  return value;
}
export function semanticDiff(before, after, kind) {
  const differences = [];
  const visit = (old, next, at) => {
    if (equal(old, next)) return;
    if (old && next && !Array.isArray(old) && !Array.isArray(next) && typeof old === 'object' && typeof next === 'object') {
      for (const key of [...new Set([...Object.keys(old), ...Object.keys(next)])].sort()) visit(old[key], next[key], `${at}.${key}`);
    } else {
      differences.push({ path: at, kind: old === undefined ? 'added' : next === undefined ? 'removed' : 'changed', ...(old === undefined ? {} : { before: old }), ...(next === undefined ? {} : { after: next }) });
    }
  };
  if (kind === 'pokemon') {
    visit(Object.fromEntries(before.map((row) => [row.name, canonical(row)])), Object.fromEntries(after.map((row) => [row.name, canonical(row)])), 'pokemon');
  } else if (kind === 'images') {
    visit([...new Set(before)].sort(), [...new Set(after)].sort(), 'prankster');
  } else visit(before, after, 'i18n');
  return differences;
}

export function validateDataset(data, translations, images, registry, messages) {
  assert(Array.isArray(data) && data.length > 0, '主数据为空');
  assert(translations && !Array.isArray(translations) && Object.keys(translations).length > 0, '翻译为空');
  assert(Array.isArray(images) && images.length > 0, '图片为空');
  const ids = new Set(); const names = new Set(); const national = new Set(); const referenced = new Set();
  const registryIDs = new Set();
  for (const [name, id] of Object.entries(registry)) {
    assert(name && Number.isSafeInteger(id) && id > 0 && !registryIDs.has(id), `注册表 ID 无效: ${name}`);
    registryIDs.add(id);
  }
  const secureImage = (url) => {
    assert(typeof url === 'string' && url === url.trim() && new URL(url).protocol === 'https:', `图片 URL 无效: ${url}`);
  };
  const uniqueStrings = (items, label, min = 1) => {
    assert(Array.isArray(items) && items.length >= min && items.every((item) => typeof item === 'string' && item && item === item.trim()) && new Set(items).size === items.length, `${label} 无效`);
  };
  for (const row of data) {
    assert(Number.isSafeInteger(row.id) && row.id > 0 && !ids.has(row.id), `ID 重复/无效: ${row.name}`); ids.add(row.id);
    assert(typeof row.name === 'string' && /^[a-z0-9-]+$/.test(row.name) && !names.has(row.name), `名称重复/无效: ${row.name}`); names.add(row.name);
    assert.equal(registry[row.name], row.id, `ID 注册表不一致: ${row.name}`);
    assert(Number.isInteger(row.pokedex_id_national) && row.pokedex_id_national >= 1 && row.pokedex_id_national <= 1025, `全国编号无效: ${row.name}`); national.add(row.pokedex_id_national);
    assert(Number.isInteger(row.generation) && row.generation >= 1 && row.generation <= 9, `世代无效: ${row.name}`);
    assert([1, 2, 3].includes(row.evolution_stage) && ['', 'level', 'item', 'trade', 'unique'].includes(row.evolution_method), `进化无效: ${row.name}`);
    const stats = ['hp', 'attack', 'defense', 'sp_attack', 'sp_defense', 'speed'];
    assert(row.base_stats && equal(Object.keys(row.base_stats).sort(), [...stats].sort()) && stats.every((stat) => Number.isInteger(row.base_stats[stat]) && row.base_stats[stat] > 0), `种族值无效: ${row.name}`);
    assert.equal(stats.reduce((sum, stat) => sum + row.base_stats[stat], 0), row.base_stats_total, `种族值总和错误: ${row.name}`);
    uniqueStrings(row.types, `${row.name} 属性`); assert(row.types.length <= 2);
    assert(row.types.every((type) => ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'].includes(type)), `未知属性: ${row.name}`);
    uniqueStrings(row.abilities, `${row.name} 特性`); uniqueStrings(row.tags ?? [], `${row.name} 标签`, 0);
    for (const key of [row.name, ...row.types, ...row.abilities]) referenced.add(key);
    for (const locale of locales) {
      const dictionary = messages[locale]; assert(dictionary, `缺少界面语言: ${locale}`);
      for (const tag of row.tags ?? []) assert(dictionary.tags?.[tag]?.trim(), `缺少标签翻译: ${locale}/${tag}`);
      assert(typeof row.evolution_method_detail === 'string', `进化细节无效: ${row.name}`);
      if (row.evolution_method_detail) assert(dictionary.evolutionMethods?.[row.evolution_method_detail]?.trim(), `缺少进化翻译: ${locale}/${row.evolution_method_detail}`);
    }
    secureImage(row.profile);
  }
  assert.equal(national.size, 1025, '种族覆盖不完整，需要逐项审核范围变更');
  for (const key of referenced) assert(translations[key], `缺少翻译: ${key}`);
  for (const [key, translation] of Object.entries(translations)) {
    assert(equal(Object.keys(translation).sort(), [...locales].sort()), `语言范围错误: ${key}`);
    for (const locale of locales) assert(typeof translation[locale] === 'string' && translation[locale].trim() && translation[locale] === translation[locale].trim(), `翻译为空/未清理: ${key}/${locale}`);
  }
  for (const [name, detail] of [['marill', 'level-friendship'], ['blissey', 'level-friendship'], ['gallade', 'item-stone-dawn-male'], ['froslass', 'item-stone-dawn-female']]) assert.equal(data.find((row) => row.name === name)?.evolution_method_detail, detail, `进化修正回退: ${name}`);
  for (const [name, locale, value] of [['iron-boulder', 'zh-hans', '铁磐岩'], ['iron-boulder', 'zh-hant', '鐵磐岩'], ['sharpness', 'zh-hans', '锋锐'], ['sharpness', 'zh-hant', '鋒銳'], ['zero-to-hero', 'zh-hans', '全能变身'], ['zero-to-hero', 'zh-hant', '全能變身'], ['thermal-exchange', 'es', 'Termoconversión'], ['wind-rider', 'en', 'Wind Rider'], ['minun', 'zh-hans', '负电拍拍']]) assert.equal(translations[name]?.[locale], value, `翻译修正回退: ${name}/${locale}`);
  assert.equal(new Set(images).size, images.length, '恶作剧图片重复'); images.forEach(secureImage);
  return { pokemon: data.length, species: national.size, translations: Object.keys(translations).length, prankster: images.length };
}

const loadDataset = (dir) => Promise.all(files.map((file) => readJSON(path.join(dir, file))));
const loadMessages = async () => Object.fromEntries(await Promise.all(locales.map(async (locale) => [locale, await readJSON(path.join(root, `src/messages/${locale}.json`))])));
export async function generatorHashes() {
  return hashes(tool, (await fs.readdir(tool)).filter((file) => file.endsWith('.go') || ['go.mod', 'go.sum', 'corrections.json'].includes(file)).sort());
}
async function sourceHashes(cacheDir) {
  const sources = [];
  for (const name of (await fs.readdir(cacheDir)).sort()) {
    const file = path.join(cacheDir, name); const entry = await readJSON(file);
    // The Go cache verifies exact response bytes during replay. Here the full cache envelope is bound to the manifest.
    assert(entry.url && entry.fetched_at && /^[a-f0-9]{64}$/.test(entry.sha256) && entry.body, `缓存清单无效: ${name}`);
    sources.push({ file: name, url: entry.url, fetched_at: entry.fetched_at, response_sha256: entry.sha256, cache_sha256: await fileHash(file) });
  }
  assert(sources.length > 0, '来源为空'); return sources;
}
async function generate(args) {
  assert(args.length === 0 || (args.length === 2 && ['--from', '--resume'].includes(args[0])), 'generate [--from <run-id> | --resume <run-id>]');
  const id = `${new Date().toISOString().replace(/[-:.]/g, '')}-${process.pid}`;
  const dir = runPath(id); await fs.mkdir(dir, { recursive: true });
  const cache = path.join(dir, 'cache');
  if (args.length) await fs.cp(path.join(runPath(args[1]), 'cache'), cache, { recursive: true });
  else await fs.mkdir(cache);
  const manifest = { schema: 1, id, started_at: new Date().toISOString(), baseline_commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), baseline: await hashes(published, [...files, 'dataset.json']), baseline_registry: await fileHash(registryFile), generator: await generatorHashes(), replay_of: args[1] ?? null, source_mode: args[0] === '--from' ? 'cached-api-offline' : 'live-api-cached' };
  await writeJSON(path.join(dir, 'started.json'), manifest);
  console.log(`批次 ${id}\n候选: ${dir}`);
  await new Promise((resolve, reject) => {
    const process = spawn('go', ['run', '.', 'snapshot', dir, cache, registryFile, args[0] === '--from' ? 'offline' : 'online'], { cwd: tool, stdio: 'inherit' });
    process.on('error', reject); process.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`生成失败 (${code})，缓存保留在 ${id}；可用 --resume 重试`)));
  });
  assert(equal(manifest.generator, await generatorHashes()), '生成中源码发生变化，请从同一缓存重新生成');
  manifest.candidate = await hashes(path.join(dir, 'output'));
  manifest.registry = await fileHash(path.join(dir, 'id-registry.json'));
  manifest.translation_events = await fileHash(path.join(dir, 'translation-events.json'));
  manifest.sources = await sourceHashes(cache);
  manifest.completed_at = new Date().toISOString();
  await writeJSON(path.join(dir, 'manifest.json'), manifest);
  console.log(`生成完成。下一步: mise run data:review -- ${id}`);
}
export async function verifiedRun(id) {
  const dir = runPath(id); const manifest = await readJSON(path.join(dir, 'manifest.json'));
  assert(manifest.schema === 1 && manifest.id === id && manifest.completed_at, '批次未完成');
  assert(equal(manifest.baseline, await hashes(published, [...files, 'dataset.json'])), '发布基准已变化，必须重新生成和校对');
  assert.equal(manifest.baseline_registry, await fileHash(registryFile), 'ID 注册表已变化');
  assert(equal(manifest.generator, await generatorHashes()), '生成器/修正表已变化，必须重新生成');
  assert(equal(manifest.candidate, await hashes(path.join(dir, 'output'))), '候选哈希不一致');
  assert.equal(manifest.registry, await fileHash(path.join(dir, 'id-registry.json')), '候选注册表被修改');
  assert.equal(manifest.translation_events, await fileHash(path.join(dir, 'translation-events.json')), '翻译记录被修改');
  assert(equal(manifest.sources, await sourceHashes(path.join(dir, 'cache'))), '来源缓存被修改');
  const candidate = await loadDataset(path.join(dir, 'output')); const baseline = await loadDataset(published);
  const registry = await readJSON(path.join(dir, 'id-registry.json')); const previousRegistry = await readJSON(registryFile);
  for (const [name, identity] of Object.entries(previousRegistry)) assert.equal(registry[name], identity, `ID 被回收/改变: ${name}`);
  const counts = validateDataset(...candidate, registry, await loadMessages());
  const oldNames = new Map(baseline[0].map((row) => [row.name, row]));
  for (const row of candidate[0]) if (oldNames.has(row.name)) {
    assert.equal(row.id, oldNames.get(row.name).id, `已发布 ID 改变: ${row.name}`);
    assert.equal(row.pokedex_id_national, oldNames.get(row.name).pokedex_id_national, `名称的种族身份改变: ${row.name}`);
  }
  const differences = [semanticDiff(baseline[0], candidate[0], 'pokemon'), semanticDiff(baseline[1], candidate[1], 'i18n'), semanticDiff(baseline[2], candidate[2], 'images')];
  return { dir, manifest, candidate, baseline, counts, differences };
}
async function checkImages(candidate, baseline) {
  const old = new Set([...baseline[0].map((row) => row.profile), ...baseline[2]]);
  const changed = [...new Set([...candidate[0].map((row) => row.profile), ...candidate[2]])].filter((url) => !old.has(url));
  const results = [];
  for (const url of changed) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    const contentType = response.headers.get('content-type');
    assert(response.ok && contentType?.startsWith('image/') && new URL(response.url).protocol === 'https:', `图片不可用: ${url} (${response.status}, ${contentType})`);
    const bytes = Buffer.from(await response.arrayBuffer()); assert(bytes.length > 0, `图片为空: ${url}`);
    results.push({ url, checked_at: new Date().toISOString(), status: response.status, content_type: contentType, sha256: hash(bytes) });
  }
  return results;
}
async function review(id) {
  const { dir, manifest, candidate, baseline, counts, differences } = await verifiedRun(id);
  const events = await readJSON(path.join(dir, 'translation-events.json'));
  const corrected = new Set(events.filter((event) => event.kind === 'override').map((event) => `${event.entity}/${event.locale}`));
  const remainingFallbacks = events.filter((event) => event.kind === 'english-form-fallback' && !corrected.has(`${event.entity}/${event.locale}`));
  const report = { id, reviewed_at: new Date().toISOString(), manifest_sha256: await fileHash(path.join(dir, 'manifest.json')), validator_sha256: await fileHash(import.meta.filename), counts, differences, high_risk: differences[0].filter((diff) => /^pokemon\.[^.]+$/.test(diff.path) || /\.(id|pokedex_id_national)$/.test(diff.path)), translation_events: events, remaining_english_fallbacks: remainingFallbacks, images: await checkImages(candidate, baseline), candidate: manifest.candidate };
  await withDecisionLock(dir, async () => {
    await fs.writeFile(path.join(dir, 'review.json'), json(report));
    const lines = [`# 数据校对 ${id}`, '', `记录 ${counts.pokemon}；种族 ${counts.species}；翻译 ${counts.translations}；图片 ${counts.prankster}。`, '', ...differences.flat().map((diff) => `- ${diff.path}: ${JSON.stringify(diff.before)} → ${JSON.stringify(diff.after)}`), '', `翻译覆盖/回退详见 review.json (${report.translation_events?.length ?? 0} 条)。`, `新增/删除/身份变化: ${report.high_risk.length} 条。`, ''];
    await fs.writeFile(path.join(dir, 'review.md'), lines.join('\n'));
    const reviewedHash = await fileHash(path.join(dir, 'review.json'));
    const previousDecisions = await readJSON(path.join(dir, 'decisions.json')).catch((error) => { if (error.code === 'ENOENT') return null; throw error; });
    await fs.writeFile(path.join(dir, 'decisions.json'), json({ schema: 1, report_sha256: reviewedHash, revision: 0, decisions: {}, history: previousDecisions?.history ?? [] }));
    console.log(`${lines.slice(0, 4).join('\n')}\n差异: ${differences.map((items) => items.length).join(' / ')}；高风险: ${report.high_risk.length}\n校对文件: ${path.join(dir, 'review.md')}\n使用 mise run data:console 逐项确认后应用: mise run data:apply -- ${id} --review ${reviewedHash}`);
  });
}

// Stage every file before replacing any target; on an ordinary I/O failure restore original bytes in memory.
// A process/power interruption is detected by dataset hashes in data:verify; Git remains the recovery mechanism.
export async function replaceBatch(entries, rename = fs.rename) {
  const staged = []; const replaced = [];
  try {
    for (const [destination, bytes] of entries) {
      const original = await fs.readFile(destination).catch((err) => { if (err.code === 'ENOENT') return null; throw err; });
      const temporary = `${destination}.stage-${process.pid}`;
      await fs.writeFile(temporary, bytes, { flag: 'wx' }); staged.push({ destination, temporary, original });
    }
    for (const entry of staged) { await rename(entry.temporary, entry.destination); replaced.push(entry); }
  } catch (error) {
    for (const { destination, original } of replaced.reverse()) {
      if (original === null) await fs.rm(destination); else await fs.writeFile(destination, original);
    }
    throw error;
  } finally {
    for (const { temporary } of staged) await fs.rm(temporary, { force: true });
  }
}
async function apply(id, flag, reviewedHash) {
  assert(flag === '--review' && /^[a-f0-9]{64}$/.test(reviewedHash ?? ''), 'apply <run-id> --review <review.json 的 SHA-256>');
  const { dir, manifest, differences } = await verifiedRun(id);
  assert.equal(await fileHash(path.join(dir, 'review.json')), reviewedHash, '校对报告已变化');
  const report = await readJSON(path.join(dir, 'review.json'));
  assert.equal(report.manifest_sha256, await fileHash(path.join(dir, 'manifest.json')), '校对对应另一候选');
  assert.equal(report.validator_sha256, await fileHash(import.meta.filename), '校验实现已变化，请重新校对');
  assert(equal(report.differences, differences), '差异报告不一致');
  await withDecisionLock(dir, async () => {
    assert.equal(await fileHash(path.join(dir, 'review.json')), reviewedHash, '校对报告已变化');
    const decisionBytes = await fs.readFile(path.join(dir, 'decisions.json')).catch((error) => {
      if (error.code === 'ENOENT') throw new Error('请先在 data:console 中确认当前批次的变更');
      throw error;
    });
    assertApproved(report, JSON.parse(decisionBytes), reviewedHash);
    const metadata = { version: hash(files.map((file) => `${file}:${manifest.candidate[file]}`).join('\n')), files: manifest.candidate, run: id, sources: hash(json(manifest.sources)) };
    const entries = await Promise.all(files.map(async (file) => [path.join(published, file), await fs.readFile(path.join(dir, 'output', file))]));
    for (const [index, file] of files.entries()) assert.equal(hash(entries[index][1]), manifest.candidate[file], '读取发布内容时候选发生变化');
    const registryBytes = await fs.readFile(path.join(dir, 'id-registry.json'));
    assert.equal(hash(registryBytes), manifest.registry, '读取发布内容时注册表发生变化');
    entries.push([registryFile, registryBytes], [path.join(published, 'dataset.json'), json(metadata)]);
    const lock = await fs.open(path.join(tool, 'output/apply.lock'), 'wx');
    try {
      // Recheck after taking the exclusive publication lock.
      assert(equal(manifest.baseline, await hashes(published, [...files, 'dataset.json'])), '发布基准已变化');
      assert.equal(manifest.baseline_registry, await fileHash(registryFile), '注册表已变化');
      assert.equal(hash(await fs.readFile(path.join(dir, 'decisions.json'))), hash(decisionBytes), '应用前审核决定发生变化');
      await replaceBatch(entries);
    } finally { await lock.close(); await fs.rm(path.join(tool, 'output/apply.lock')); }
    console.log(`已应用 ${id}，数据版本 ${metadata.version}。请运行 mise run check。`);
  });
}
async function verify() {
  const data = await loadDataset(published); const metadata = await readJSON(path.join(published, 'dataset.json'));
  const current = await hashes(published);
  assert(equal(metadata.files, current), '发布文件与 dataset.json 哈希不一致，请通过 data:apply 更新');
  assert.equal(metadata.version, hash(files.map((file) => `${file}:${current[file]}`).join('\n')), '数据版本错误');
  console.log(validateDataset(...data, await readJSON(registryFile), await loadMessages()));
}
if (process.argv[1] && await fs.realpath(process.argv[1]) === import.meta.filename) {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === 'generate') await generate(args);
    else if (command === 'review' && args.length === 1) await review(args[0]);
    else if (command === 'apply' && args.length === 3) await apply(...args);
    else if (command === 'verify' && args.length === 0) await verify();
    else throw new Error('使用 generate / review <run-id> / apply <run-id> --review <sha256> / verify');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
