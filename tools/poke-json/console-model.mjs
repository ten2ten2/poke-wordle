import * as fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { paths, files, generatorHashes, verifiedRun, semanticDiff } from './pipeline.mjs';
import { digest, reviewItems, decisionSummary, changeDecisions, assertApproved, withDecisionLock } from './review-state.mjs';

export const readJSON = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const optionalJSON = async (file) => readJSON(file).catch((error) => { if (error.code === 'ENOENT') return null; throw error; });
const hashFile = async (file) => digest(await fs.readFile(file));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const runDir = (id) => { assert.match(id ?? '', /^[\w-]+$/, '批次编号无效'); return path.join(paths.runs, id); };
const loadData = async (dir) => Promise.all(files.map((file) => optionalJSON(path.join(dir, file))));

async function findRun(id) {
  const dir = runDir(id);
  const manifest = await optionalJSON(path.join(dir, 'manifest.json'));
  const started = await optionalJSON(path.join(dir, 'started.json'));
  if (manifest || started) return { dir, manifest, started, report: await optionalJSON(path.join(dir, 'review.json')), archive: false };
  const archive = (await archives()).find((entry) => entry.manifest.id === id);
  assert(archive, '批次不存在');
  return { dir, manifest: archive.manifest, started: archive.manifest, report: archive.review, archive: true, archivedDecisions: archive.decisions };
}
async function archives() {
  const names = await fs.readdir(path.join(paths.tool, 'reports')).catch((error) => { if (error.code === 'ENOENT') return []; throw error; });
  const results = await Promise.all(names.filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).map((name) => readJSON(path.join(paths.tool, 'reports', name))));
  return results.filter((entry) => entry.manifest?.id && entry.review);
}
async function currentState() {
  const metadata = await readJSON(path.join(paths.published, 'dataset.json'));
  const baseline = Object.fromEntries(await Promise.all([...files, 'dataset.json'].map(async (name) => [name, await hashFile(path.join(paths.published, name))])));
  return { metadata, baseline, generator: await generatorHashes(), registry: await hashFile(paths.registryFile), validator: await hashFile(path.join(paths.tool, 'pipeline.mjs')) };
}
function runStatus(run, current) {
  if (run.manifest?.id === current.metadata.run) return { status: 'applied', issues: [] };
  if (run.archive) return { status: 'archived', issues: [] };
  if (!run.manifest) return { status: 'incomplete', issues: ['本批生成未完成。查看任务日志，修正后复用缓存重建。'] };
  const issues = [];
  for (const [file, hash] of Object.entries(run.manifest.baseline)) if (current.baseline[file] !== hash) { issues.push('发布基准已改变，请从缓存重建新批次。'); break; }
  if (current.registry !== run.manifest.baseline_registry || !same(current.generator, run.manifest.generator)) issues.push('生成器、修正表或 ID 注册表已改变，需要重新生成。');
  if (issues.length) return { status: 'stale', issues };
  if (!run.report || run.report.validator_sha256 !== current.validator) return { status: 'needs_review', issues: ['需要运行自动校对，生成当前版本的差异报告。'] };
  return { status: 'reviewable', issues: [] };
}

export async function listRuns() {
  const [entries, archive, current] = await Promise.all([
    fs.readdir(paths.runs, { withFileTypes: true }).catch((error) => { if (error.code === 'ENOENT') return []; throw error; }), archives(), currentState(),
  ]);
  const ids = new Set([...entries.filter((entry) => entry.isDirectory() && /^[\w-]+$/.test(entry.name)).map((entry) => entry.name), ...archive.map((entry) => entry.manifest.id)]);
  const rows = [];
  for (const id of [...ids].sort().reverse()) {
    try {
      const run = await findRun(id); const state = runStatus(run, current);
      rows.push({ id, ...state, started_at: (run.manifest ?? run.started).started_at, counts: run.report?.counts, archive: run.archive });
    } catch (error) { rows.push({ id, status: 'incomplete', issues: [error.message] }); }
  }
  return { runs: rows, published_run: current.metadata.run };
}

function referenceURLs(item, pokemon, manifest) {
  if (item.category === 'image') return [];
  const urls = [];
  if (pokemon) {
    urls.push(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.pokedex_id_national}/`);
    if (['translation', 'formatting', 'correction', 'fallback'].includes(item.category)) urls.push(`https://pokeapi.co/api/v2/pokemon-form/${item.entity}/`);
    else {
      const id = pokemon.profile?.match(/\/(\d+)\.png$/)?.[1];
      if (id) urls.unshift(`https://pokeapi.co/api/v2/pokemon/${id}/`);
    }
  } else {
    urls.push(`https://pokeapi.co/api/v2/ability/${item.entity}/`, `https://pokeapi.co/api/v2/type/${item.entity}/`);
  }
  const index = new Map(manifest.sources.map((source) => [source.url, source]));
  return urls.map((url) => index.get(url)).filter(Boolean);
}
export async function inspectRun(id) {
  const run = await findRun(id); const current = await currentState(); const state = runStatus(run, current);
  const baseline = await loadData(paths.published);
  const candidate = run.archive ? baseline : await loadData(path.join(run.dir, 'output'));
  let report = run.report;
  if (!report && Array.isArray(candidate[0]) && candidate[1] && Array.isArray(candidate[2])) {
    report = { differences: [semanticDiff(baseline[0], candidate[0], 'pokemon'), semanticDiff(baseline[1], candidate[1], 'i18n'), semanticDiff(baseline[2], candidate[2], 'images')], translation_events: await optionalJSON(path.join(run.dir, 'translation-events.json')) ?? [], counts: { pokemon: candidate[0].length, translations: Object.keys(candidate[1]).length, prankster: candidate[2].length } };
  }
  const reportHash = run.report && !run.archive ? await hashFile(path.join(run.dir, 'review.json')) : null;
  if (state.status === 'reviewable') {
    for (const name of files) {
      if (await hashFile(path.join(run.dir, 'output', name)) !== run.manifest.candidate[name]) { state.status = 'stale'; state.issues.push('候选文件已改变，请重新生成。'); break; }
    }
    if (await hashFile(path.join(run.dir, 'manifest.json')) !== report.manifest_sha256) { state.status = 'stale'; state.issues.push('来源清单与报告不一致，请重新校对。'); }
  }
  const decisions = run.archive ? run.archivedDecisions : await optionalJSON(path.join(run.dir, 'decisions.json'));
  const items = report ? reviewItems(report) : [];
  const rows = Array.isArray(candidate[0]) ? candidate[0] : baseline[0];
  const byName = new Map(rows.map((row) => [row.name, row]));
  const translations = candidate[1] ?? baseline[1];
  const messages = await readJSON(path.join(paths.root, 'src/messages/zh-hans.json'));
  for (const item of items) {
    const pokemon = byName.get(item.entity) ?? (item.after?.pokedex_id_national ? item.after : null);
    item.label = translations[item.entity]?.['zh-hans'] ?? item.entity;
    item.pokemon = pokemon ? { name: pokemon.name, national: pokemon.pokedex_id_national, profile: pokemon.profile } : null;
    item.sources = run.manifest ? referenceURLs(item, pokemon, run.manifest) : [];
    if (item.category === 'image') {
      const sprite = item.entity.match(/\/(\d+)\.gif$/)?.[1];
      const member = rows.find((row) => row.profile.endsWith(`/${sprite}.png`));
      item.label = member ? translations[member.name]?.['zh-hans'] ?? member.name : `图片 ${sprite ?? ''}`;
      item.image_check = report.images?.find((entry) => entry.url === item.entity) ?? null;
    }
    if (run.archive || decisions?.report_sha256 === reportHash) item.decision = decisions?.decisions?.[item.id] ?? null;
  }
  return {
    id, ...state, archive: run.archive, report_hash: reportHash, revision: decisions?.report_sha256 === reportHash ? decisions.revision : 0,
    counts: report?.counts, started_at: (run.manifest ?? run.started).started_at,
    source_count: run.manifest?.sources.length ?? 0, source_mode: run.manifest?.source_mode,
    summary: decisionSummary(items, decisions, reportHash), items,
    translations: Object.fromEntries([...new Set(rows.flatMap((row) => [...row.types, ...row.abilities]))].map((key) => [key, translations[key]?.['zh-hans'] ?? key])),
    messages: { tags: messages.tags, evolutionMethods: messages.evolutionMethods },
  };
}

async function requireCurrent(id, reportHash) {
  const { differences } = await verifiedRun(id);
  const dir = runDir(id); const report = await readJSON(path.join(dir, 'review.json'));
  assert.equal(await hashFile(path.join(dir, 'review.json')), reportHash, '报告已变化，请刷新后重新确认');
  assert.equal(report.validator_sha256, await hashFile(path.join(paths.tool, 'pipeline.mjs')), '自动校对已过时，请重新校对');
  assert.equal(report.manifest_sha256, await hashFile(path.join(dir, 'manifest.json')), '报告与来源清单不一致');
  assert(same(report.differences, differences), '差异报告不一致，请重新校对');
  return { dir, report };
}
export async function saveDecisions(id, body) {
  const { dir, report } = await requireCurrent(id, body.report_hash);
  return withDecisionLock(dir, async () => {
    assert.equal(await hashFile(path.join(dir, 'review.json')), body.report_hash, '报告已变化，请刷新');
    const file = path.join(dir, 'decisions.json');
    const current = await optionalJSON(file);
    const state = changeDecisions(reviewItems(report), current, body.report_hash, body.changes, body.revision);
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { flag: 'wx' });
      await fs.rename(temporary, file);
    } finally { await fs.rm(temporary, { force: true }); }
    return { revision: state.revision, summary: decisionSummary(reviewItems(report), state, body.report_hash) };
  });
}
export async function requireApproval(id, reportHash) {
  const { dir, report } = await requireCurrent(id, reportHash);
  assertApproved(report, await readJSON(path.join(dir, 'decisions.json')), reportHash);
}
export async function exportReview(id) {
  const run = await findRun(id);
  return { schema_version: 2, manifest: run.manifest, review: run.report, decisions: run.archive ? run.archivedDecisions ?? null : await optionalJSON(path.join(run.dir, 'decisions.json')) };
}
export async function readSource(id, name) {
  assert.match(name ?? '', /^[\w-]+\.json$/, '来源文件无效');
  const run = await findRun(id); assert(run.manifest?.sources.some((source) => source.file === name), '来源未收录于此批次');
  const file = path.join(run.dir, 'cache', name);
  const source = run.manifest.sources.find((entry) => entry.file === name);
  const bytes = await fs.readFile(file); assert.equal(digest(bytes), source.cache_sha256, '来源缓存已变化');
  const entry = JSON.parse(bytes);
  const selected = Object.fromEntries(['id', 'name', 'names', 'form_names', 'forms', 'types', 'abilities', 'stats', 'generation', 'varieties', 'evolution_chain', 'chain', 'is_legendary', 'is_mythical'].filter((key) => key in entry.body).map((key) => [key, entry.body[key]]));
  return { ...source, body: selected };
}
