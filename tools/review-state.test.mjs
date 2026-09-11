import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { reviewItems, changeDecisions, decisionSummary, assertApproved, withDecisionLock } from './review-state.mjs';

const report = { differences: [[{ path: 'pokemon.raichu.tags', kind: 'changed', before: [], after: ['has-mega'] }], [{ path: 'i18n.example.en', kind: 'changed', before: "Name's", after: 'Name’s' }], [{ path: 'prankster', before: ['https://old'], after: ['https://new'] }]] };

test('changes expose independent image decisions, formatting and concrete value identities', () => {
  const items = reviewItems(report);
  assert.equal(items.length, 4);
  assert.equal(items[1].category, 'formatting');
  assert.equal(items.filter((item) => item.category === 'image').length, 2);
  const changed = structuredClone(report); changed.differences[0][0].after = ['other-tag'];
  assert.notEqual(reviewItems(changed)[0].id, items[0].id);
});
test('pending, keep, fix and defer block application; changed reports and revisions invalidate approval', () => {
  const items = reviewItems(report);
  let state = changeDecisions(items, null, 'report-a', items.map((item) => ({ id: item.id, status: 'accepted' })), 0);
  assertApproved(report, state, 'report-a');
  for (const status of ['keep', 'fix', 'defer', 'pending']) {
    const blocked = changeDecisions(items, state, 'report-a', [{ id: items[0].id, status, note: 'check source' }], state.revision);
    assert.throws(() => assertApproved(report, blocked, 'report-a'), /不能应用/);
    assert.equal(blocked.history.at(-1).changes[0].note, 'check source');
  }
  assert.throws(() => assertApproved(report, state, 'report-b'), /当前报告/);
  assert.throws(() => changeDecisions(items, state, 'report-a', [{ id: items[0].id, status: 'keep' }], 0), /另一页面/);
  state = changeDecisions(items, state, 'report-b', [{ id: items[0].id, status: 'accepted' }], 0);
  assert.equal(decisionSummary(items, state, 'report-b').pending, 3);
  assert.equal(state.history.length, 2);
});
test('identity changes require individual decisions and references cannot be falsely approved', () => {
  const risky = { differences: [[{ path: 'pokemon.new-form', kind: 'added', after: { id: 1136 } }, { path: 'pokemon.other-form', kind: 'removed', before: { id: 1137 } }]], translation_events: [{ kind: 'override', entity: 'pokemon:minun', locale: 'zh-hans', upstream: '負电拍拍', value: '负电拍拍' }] };
  const items = reviewItems(risky);
  assert.throws(() => changeDecisions(items, null, 'a', items.slice(0, 2).map((item) => ({ id: item.id, status: 'accepted' })), 0), /逐项确认/);
  assert.throws(() => changeDecisions(items, null, 'a', [{ id: items[2].id, status: 'accepted' }], 0), /条目已失效/);
});

test('review, save and apply exclude concurrent mutations and release the lock after failure', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'poke-decision-lock-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await assert.rejects(withDecisionLock(dir, async () => {
    await assert.rejects(withDecisionLock(dir, () => assert.fail('must not run')), /正在保存/);
    throw new Error('operation failed');
  }), /operation failed/);
  assert.equal(await withDecisionLock(dir, async () => 'released'), 'released');
});
