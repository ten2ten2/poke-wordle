import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import path from 'node:path';

export async function withDecisionLock(dir, operation) {
  const file = path.join(dir, 'decisions.lock');
  const lock = await fs.open(file, 'wx').catch((error) => {
    if (error.code === 'EEXIST') throw new Error('此批次正在保存、校对或应用，请稍后重试');
    throw error;
  });
  try { return await operation(); }
  finally { await lock.close(); await fs.rm(file, { force: true }); }
}

export const digest = (value) => createHash('sha256').update(value).digest('hex');
const itemID = (value) => digest(JSON.stringify(value));
const normalizedText = (value) => typeof value === 'string' ? value.trim().normalize('NFC').replace(/[‘’]/g, "'").replace(/[“”]/g, '"') : value;

// Approval identities include both values, so an approval cannot silently cover a different change.
export function reviewItems(report) {
  const items = [];
  for (const diff of report.differences.flat()) {
    if (diff.path === 'prankster') {
      const before = new Set(diff.before ?? []); const after = new Set(diff.after ?? []);
      for (const url of [...new Set([...before, ...after])].sort()) {
        if (before.has(url) === after.has(url)) continue;
        items.push({ category: 'image', entity: url, field: 'profile', before: before.has(url) ? url : null, after: after.has(url) ? url : null, kind: after.has(url) ? 'added' : 'removed', requiresDecision: true });
      }
      continue;
    }
    const [group, entity, ...parts] = diff.path.split('.');
    const field = parts.join('.');
    const formatting = group === 'i18n' && typeof diff.before === 'string' && typeof diff.after === 'string' && normalizedText(diff.before) === normalizedText(diff.after);
    items.push({ category: formatting ? 'formatting' : group === 'i18n' ? 'translation' : 'pokemon', entity, field, before: diff.before ?? null, after: diff.after ?? null, kind: diff.kind, highRisk: group === 'pokemon' && (!field || ['id', 'pokedex_id_national'].includes(field)), requiresDecision: true });
  }
  for (const event of report.remaining_english_fallbacks ?? []) {
    items.push({ category: 'fallback', entity: event.entity.replace(/^pokemon:/, ''), field: event.locale, before: null, after: event.value, kind: 'fallback', requiresDecision: true });
  }
  const evidence = new Map((report.translation_events ?? []).filter((event) => event.kind === 'correction-source').map((event) => [`${event.entity}/${event.locale}`, event]));
  for (const event of report.translation_events ?? []) {
    if (event.kind !== 'override') continue;
    const entity = event.entity.replace(/^(pokemon|form):/, '');
    const source = evidence.get(`${event.entity}/${event.locale}`);
    items.push({ category: 'correction', entity, field: event.locale, before: event.upstream, after: event.value, kind: event.entity.startsWith('form:') ? 'form-label' : 'override', requiresDecision: false, reason: source?.reason ?? '仅补充上游缺失的地区形态名称', source: source?.source ?? `https://pokeapi.co/api/v2/pokemon-form/${entity}/` });
  }
  return items.map((item) => ({ ...item, id: itemID(item) }));
}

export function decisionSummary(items, state, reportHash) {
  const current = state?.report_sha256 === reportHash;
  const required = items.filter((item) => item.requiresDecision);
  const decisions = current ? state.decisions ?? {} : {};
  return {
    total: required.length,
    accepted: required.filter((item) => decisions[item.id]?.status === 'accepted').length,
    pending: required.filter((item) => !decisions[item.id] || decisions[item.id].status === 'pending').length,
    held: required.filter((item) => ['keep', 'fix', 'defer'].includes(decisions[item.id]?.status)).length,
    outdated: Boolean(state && !current),
    ready: current && required.every((item) => decisions[item.id]?.status === 'accepted'),
  };
}

export function changeDecisions(items, current, reportHash, changes, revision) {
  assert(Number.isInteger(revision) && revision >= 0, '审核版本无效');
  const state = current?.report_sha256 === reportHash ? structuredClone(current) : { schema: 1, report_sha256: reportHash, revision: 0, decisions: {}, history: current?.history ?? [] };
  assert.equal(revision, state.revision, '审核记录已被另一页面修改，请刷新');
  assert(Array.isArray(changes) && changes.length > 0 && changes.length <= 500, '请选择要确认的变更');
  const available = new Map(items.filter((item) => item.requiresDecision).map((item) => [item.id, item]));
  const seen = new Set();
  for (const change of changes) {
    const item = available.get(change.id);
    assert(item && !seen.has(change.id), '变更条目已失效'); seen.add(change.id);
    assert(['accepted', 'keep', 'fix', 'defer', 'pending'].includes(change.status), '审核状态无效');
    assert(typeof (change.note ?? '') === 'string' && (change.note ?? '').length <= 4000, '备注过长');
    assert(!item.highRisk || changes.length === 1, '新增、删除和身份变化请逐项确认');
    state.decisions[change.id] = { status: change.status, note: (change.note ?? '').trim(), updated_at: new Date().toISOString() };
  }
  state.revision += 1;
  state.updated_at = new Date().toISOString();
  state.history ??= [];
  state.history.push({ report_sha256: reportHash, revision: state.revision, at: state.updated_at, changes: changes.map((change) => ({ id: change.id, ...state.decisions[change.id] })) });
  return state;
}

export function assertApproved(report, state, reportHash) {
  assert(state?.schema === 1 && state.report_sha256 === reportHash, '缺少当前报告的人工审核记录，请通过 data:console 确认');
  const summary = decisionSummary(reviewItems(report), state, reportHash);
  assert(summary.ready, `尚有 ${summary.pending} 项待确认、${summary.held} 项待修正或暂缓，不能应用`);
}
