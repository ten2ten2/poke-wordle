import { $, element, fields } from './shared.js';
import { createDataBrowser } from './data-view.js';
const state = { token: '', runs: [], run: null, view: location.hash === '#data' ? 'data' : 'review', navigation: 0, tab: 'changes', page: 0, selected: new Set(), busy: false, saving: false, detail: null, lastJob: null };
const statuses = { applied: '已应用 · 历史记录', archived: '历史记录', stale: '需要重建', incomplete: '生成未完成', needs_review: '待自动校对', reviewable: '待人工确认', accepted: '已接受', pending: '待确认', keep: '保留原值', fix: '要求修正', defer: '暂缓', running: '运行中', passed: '已完成', failed: '失败', interrupted: '已中断' };
const categories = { pokemon: '游戏字段', translation: '名称翻译', formatting: '格式变化', image: '图片', correction: '人工修正', fallback: '英文回退' };
const historical = () => ['applied', 'archived'].includes(state.run?.status);
const editable = () => state.run?.status === 'reviewable' && !state.busy && !state.saving;
const date = (value) => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '未知时间';
const badge = (value, label) => element('span', label ?? statuses[value] ?? value, `badge ${value}`);
const notify = (message) => {
  $('notice').textContent = message; $('notice').hidden = !message;
  if ($('detail').open) { $('detail-notice').textContent = message; $('detail-notice').hidden = !message; }
};
async function api(url, body) {
  const response = await fetch(url, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Console-Token': state.token }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? '操作失败');
  return result;
}
const dataBrowser = createDataBrowser({ api, notify });
function renderView() {
  const current = state.view === 'data';
  $('current-data').hidden = !current;
  $('review-intro').hidden = current;
  $('workspace').hidden = current || !state.run;
  $('empty').hidden = current || Boolean(state.runs.length);
  $('job').hidden = !state.lastJob || (current && !state.busy);
  $('browse-data').setAttribute('aria-current', current ? 'page' : 'false');
  renderRuns(current ? null : state.run?.id);
}
async function showData() {
  state.navigation++;
  state.view = 'data'; history.replaceState(null, '', '#data'); renderView();
  await dataBrowser.load();
}
async function loadRuns(preferred) {
  const result = await api('/api/runs'); state.runs = result.runs;
  const id = preferred ?? state.run?.id ?? location.hash.slice(1) ?? result.published_run;
  const selected = state.runs.find((run) => run.id === id) ?? state.runs.find((run) => run.id === result.published_run) ?? state.runs[0];
  if (selected && state.view === 'review') await loadRun(selected.id, false);
  renderView();
}
function renderRuns(id) {
  $('runs').replaceChildren(...state.runs.map((run) => {
    const button = element('button', undefined, 'run-button btn-option');
    button.setAttribute('aria-current', run.id === id ? 'page' : 'false');
    button.append(element('span', date(run.started_at), 'run-date'), element('span', run.id.slice(-16), 'run-short'), badge(run.status));
    button.addEventListener('click', () => loadRun(run.id).catch((error) => notify(error.message)));
    return button;
  }));
}
async function loadRun(id, activate = true) {
  const navigation = activate ? ++state.navigation : state.navigation;
  const run = await api(`/api/runs/${encodeURIComponent(id)}`);
  if (navigation !== state.navigation) return;
  if (run.id !== state.run?.id || run.report_hash !== state.run?.report_hash) { state.selected.clear(); state.page = 0; }
  state.run = run;
  if (activate) state.view = 'review';
  if (state.view === 'review') history.replaceState(null, '', `#${run.id}`);
  renderView(); renderRun();
}
function renderRun() {
  const run = state.run; if (!run) return;
  $('workspace').hidden = state.view !== 'review';
  $('run-title').textContent = run.status === 'applied' ? '已应用的数据变更' : run.status === 'archived' ? '历史数据变更' : '本次数据变更';
  $('run-meta').textContent = `${date(run.started_at)}${run.counts ? ` · ${run.counts.pokemon ?? '—'} 个答案 · ${run.counts.translations ?? '—'} 个翻译键 · ${run.counts.prankster ?? '—'} 张恶作剧图片` : ''}`;
  $('run-status').replaceWith(Object.assign(badge(run.status), { id: 'run-status' }));
  $('run-note').textContent = run.issues.length ? run.issues.join(' ') : historical() ? `${run.status === 'applied' ? '这批数据已应用。' : ''}这里展示当时的旧值与候选值，供回看核对；如需更新，请生成新批次。` : '自动校验检查数据结构和来源一致性。请核对每项变化的内容；所有待确认项通过后，才能应用整批数据。';
  $('review-progress').hidden = historical();
  $('review-progress-bar').max = run.summary.total || 1;
  $('review-progress-bar').value = run.summary.total ? run.summary.accepted : 1;
  $('review-progress-label').textContent = `${run.summary.accepted} / ${run.summary.total} 项已接受 · ${run.summary.pending} 项待确认 · ${run.summary.held} 项需处理`;
  $('count-changes').textContent = run.summary.total;
  $('count-pending').textContent = historical() ? '—' : run.summary.pending;
  $('count-accepted').textContent = historical() ? '—' : run.summary.accepted;
  $('count-held').textContent = historical() ? '—' : run.summary.held;
  $('metadata').replaceChildren(...[
    `批次：${run.id}`, `来源响应：${run.source_count} 个`, `来源模式：${run.source_mode ?? '尚未完成'}`, `校对报告：${run.report_hash ?? '暂无可操作的报告'}`,
  ].map((line) => element('p', line)));
  $('export').href = `/api/runs/${encodeURIComponent(run.id)}/export`;
  $('review').disabled = state.busy || state.saving || historical() || ['incomplete', 'stale'].includes(run.status);
  $('rebuild').disabled = state.busy || state.saving || run.archive;
  $('resume').disabled = state.busy || state.saving || run.archive;
  $('generate').disabled = state.busy || state.saving;
  $('apply').disabled = !editable() || !run.summary.ready;
  $('apply-title').textContent = historical() ? '历史记录可查看，不再应用' : run.summary.ready ? '本批确认完成，可以应用' : `${run.summary.accepted} / ${run.summary.total} 项变更已接受`;
  $('apply-note').textContent = historical() ? '检查新更新或从缓存创建一个新批次。' : '应用会同步 src/data 并运行完整检查，不会自动提交或推送 Git。';
  for (const button of document.querySelectorAll('[data-tab]')) button.setAttribute('aria-selected', String(button.dataset.tab === state.tab));
  renderItems();
}
function filtered() {
  const query = $('search').value.trim().toLowerCase(); const category = $('category').value;
  return state.run.items.filter((item) => {
    const status = item.decision?.status ?? 'pending';
    if (state.tab === 'correction' ? item.category !== 'correction' : !item.requiresDecision) return false;
    if (state.tab === 'pending' && (historical() || status !== 'pending')) return false;
    if (state.tab === 'held' && !['keep', 'fix', 'defer'].includes(status)) return false;
    if (category !== 'all' && item.category !== category) return false;
    return `${item.label} ${item.entity} ${item.field} ${fields[item.field] ?? ''} ${JSON.stringify(item.before)} ${JSON.stringify(item.after)}`.toLowerCase().includes(query);
  });
}
function displayValue(item, value) {
  if (value === null || value === undefined || value === '') return '—';
  const word = (raw) => item.field === 'tags' ? state.run.messages.tags[raw] ?? raw : state.run.translations[raw] ?? raw;
  if (Array.isArray(value)) return value.length ? value.map(word).join(' · ') : '无';
  if (item.field === 'evolution_method_detail') return state.run.messages.evolutionMethods[value] ?? value;
  if (item.field === 'evolution_method') return ({ level: '升级', item: '道具', trade: '连接交换', unique: '特殊方式' })[value] ?? value;
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}
function valueNode(item, value, side, full = false) {
  const node = element('div', undefined, `value ${side}`);
  if ((item.category === 'image' || item.field === 'profile') && typeof value === 'string' && value.startsWith('https://raw.githubusercontent.com/')) {
    const img = element('img'); img.src = value; img.alt = `${item.label} ${side === 'before' ? '当前' : '候选'}图片`; img.loading = 'lazy'; node.append(img);
    if (full) node.append(element('small', value));
  } else {
    const text = displayValue(item, value); node.textContent = full || text.length < 240 ? text : `${text.slice(0, 240)}…`;
  }
  return node;
}
function renderItems() {
  if (!state.run) return;
  const matches = filtered(); const pageSize = 20; const pages = Math.max(1, Math.ceil(matches.length / pageSize)); state.page = Math.min(state.page, pages - 1);
  const visible = matches.slice(state.page * pageSize, (state.page + 1) * pageSize);
  $('items').replaceChildren();
  if (!matches.length) $('items').append(element('div', state.tab === 'pending' && historical() ? '历史批次不再进入待确认队列。' : '没有符合条件的条目。', 'empty'));
  for (const item of visible) {
    const row = element('article', undefined, 'item-row'); const name = element('div', undefined, 'item-name');
    if (editable() && item.requiresDecision && !item.highRisk) {
      const input = element('input'); input.type = 'checkbox'; input.checked = state.selected.has(item.id); input.setAttribute('aria-label', `选择 ${item.label} ${fields[item.field] ?? item.field}`);
      input.addEventListener('change', () => { if (input.checked) state.selected.add(item.id); else state.selected.delete(item.id); renderSelection(visible); }); name.append(input);
    }
    const open = element('button', undefined, 'btn-ghost'); open.append(element('strong', item.label), element('small', item.category === 'image' ? 'prankster' : item.entity), element('span', `${fields[item.field] ?? (item.field || '整条记录')}${item.highRisk ? ' · 身份变更' : ''}`, 'field-label'));
    open.addEventListener('click', () => showDetail(item)); name.append(open);
    const action = element('div', undefined, 'item-decision');
    const status = !item.requiresDecision ? 'correction' : historical() ? 'applied' : item.decision?.status ?? 'pending';
    const button = element('button', undefined, 'btn-ghost'); button.append(badge(status, !item.requiresDecision ? '查看依据' : historical() ? '查看' : statuses[status])); button.addEventListener('click', () => showDetail(item)); action.append(button);
    row.append(name, valueNode(item, item.before, 'before'), valueNode(item, item.after, 'after'), action); $('items').append(row);
  }
  $('result-count').textContent = `${matches.length} 项`;
  $('page-label').textContent = `${state.page + 1} / ${pages} 页`;
  $('previous').disabled = state.page === 0; $('next').disabled = state.page + 1 >= pages;
  renderSelection(visible);
}
function renderSelection(visible) {
  $('selection').hidden = !editable() || state.tab === 'correction';
  const selectable = visible.filter((item) => item.requiresDecision && !item.highRisk);
  $('select-page').checked = selectable.length > 0 && selectable.every((item) => state.selected.has(item.id));
  $('select-page').disabled = !selectable.length;
  $('select-page').onchange = () => { for (const item of selectable) { if ($('select-page').checked) state.selected.add(item.id); else state.selected.delete(item.id); } renderItems(); };
  $('selected-count').textContent = state.selected.size;
  $('accept-selected').disabled = !editable() || !state.selected.size;
}
function sourceLink(url, text) {
  const a = element('a', text); if (/^https:\/\//.test(url)) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; } return a;
}
function pendingNeighbors() {
  const items = state.run.items;
  const index = items.findIndex((item) => item.id === state.detail?.id);
  const pending = (item) => item.requiresDecision && (!item.decision || item.decision.status === 'pending');
  return { previous: items.slice(0, index).findLast(pending), next: items.slice(index + 1).find(pending) };
}
function navigatePending(direction) {
  if (state.saving || state.busy) return;
  if ($('decision-note').value !== (state.detail?.decision?.note ?? '')) {
    notify('备注尚未保存，请先保存审核决定再切换。'); return;
  }
  const item = pendingNeighbors()[direction];
  if (item) showDetail(item);
}
function showDetail(item) {
  state.detail = item;
  const neighbors = pendingNeighbors();
  $('previous-pending').disabled = !editable() || !neighbors.previous;
  $('next-pending').disabled = !editable() || !neighbors.next;
  $('detail-notice').hidden = true;
  $('detail-category').textContent = `${categories[item.category]}${item.highRisk ? ' / 需逐项确认' : ''}`;
  $('detail-title').textContent = item.label; $('detail-field').textContent = `${item.entity} · ${fields[item.field] ?? (item.field || '整条记录')}`;
  $('detail-values').replaceChildren(...[['before', item.before, item.category === 'correction' ? '上游值' : '当前值'], ['after', item.after, item.category === 'correction' ? '本地修正值' : '候选值']].map(([side, value, title]) => {
    const container = element('div'); container.append(element('h3', title), valueNode(item, value, side, true));
    return container;
  }));
  $('detail-reason').hidden = !item.reason; $('detail-reason').textContent = item.reason ?? '';
  $('saved-decision').hidden = !item.decision;
  $('saved-decision').textContent = item.decision ? `${statuses[item.decision.status]} · ${date(item.decision.updated_at)}${item.decision.note ? `\n${item.decision.note}` : ''}` : '';
  $('sources').replaceChildren(); $('source-body').hidden = true;
  if (item.source) { const node = element('div', undefined, 'source'); node.append(sourceLink(item.source, '修正依据 ↗')); $('sources').append(node); }
  if (item.category === 'image') {
    const node = element('div', undefined, 'source'); node.append(sourceLink(item.entity, '打开原始图片 ↗'));
    if (item.image_check) node.append(element('small', `检查时间：${date(item.image_check.checked_at)} · HTTP ${item.image_check.status} · ${item.image_check.content_type} · SHA-256：${item.image_check.sha256}`));
    $('sources').append(node);
  }
  for (const source of item.sources) {
    const node = element('div', undefined, 'source'); node.append(sourceLink(source.url, source.url.replace('https://pokeapi.co/api/v2/', 'PokeAPI / ')), element('small', `获取时间：${date(source.fetched_at)} · SHA-256：${source.response_sha256.slice(0, 16)}…`));
    if (state.run.archive) { node.append(element('small', '此历史报告未保留本地批次缓存。')); $('sources').append(node); continue; }
    const button = element('button', '查看缓存证据');
    button.addEventListener('click', async () => {
      button.disabled = true;
      try { const evidence = await api(`/api/runs/${state.run.id}/source?file=${encodeURIComponent(source.file)}`); $('source-body').textContent = JSON.stringify(evidence, null, 2); $('source-body').hidden = false; }
      catch (error) { notify(error.message); } finally { button.disabled = false; }
    }); node.append(button); $('sources').append(node);
  }
  if (!$('sources').children.length) $('sources').append(element('p', '来源清单收录在批次导出的审核记录中。', 'small muted'));
  $('decision-form').hidden = !editable() || !item.requiresDecision;
  $('decision-note').value = item.decision?.note ?? '';
  if (!$('detail').open) $('detail').showModal();
}
async function decide(changes, advance = false) {
  if (!editable()) return;
  const nextID = advance ? pendingNeighbors().next?.id : null;
  let saved = false;
  state.saving = true; renderRun();
  for (const button of document.querySelectorAll('[data-decision]')) button.disabled = true;
  try {
    await api(`/api/runs/${state.run.id}/decisions`, { report_hash: state.run.report_hash, revision: state.run.revision, changes });
    state.selected.clear(); $('detail').close(); notify(changes.some((item) => ['keep', 'fix', 'defer'].includes(item.status)) ? '决定已保存。本批暂停应用，修正生成规则后重建并重新确认。' : '审核决定已保存。');
    await loadRun(state.run.id, false); saved = true;
  } catch (error) { notify(error.message); }
  finally { state.saving = false; for (const button of document.querySelectorAll('[data-decision]')) button.disabled = false; renderRun(); }
  if (saved && nextID) { const next = state.run.items.find((item) => item.id === nextID); if (next) showDetail(next); }
}
async function job(action, mode) {
  if (state.busy || state.saving) return;
  state.busy = true; renderRun(); $('generate').disabled = true;
  try { await api('/api/jobs', { action, mode, run: state.run?.id, report_hash: state.run?.report_hash }); notify('任务已启动，可在运行日志中查看进度。'); await pollJobs(); }
  catch (error) { state.busy = false; notify(error.message); renderRun(); }
}
async function pollJobs() {
  const result = await api('/api/jobs'); const wasBusy = state.busy; state.busy = result.busy;
  const latest = result.jobs[0];
  $('job').hidden = !latest || (state.view === 'data' && !state.busy);
  if (latest) {
    const title = { generate: '生成候选与自动校对', review: '自动校对', apply: '应用数据并运行检查', check: '检查已发布数据' }[latest.action];
    $('job-title').textContent = title;
    $('job-status').replaceWith(Object.assign(badge(latest.status), { id: 'job-status' }));
    $('job-error').textContent = latest.error ? `${latest.applied ? '数据已写入，后续检查未通过。' : ''}${latest.error}` : '';
    $('job-log').textContent = latest.log || '正在准备…';
    const key = `${latest.id}/${latest.status}`;
    if (key !== state.lastJob) {
      const previous = state.lastJob; state.lastJob = key;
      if (previous && latest.status !== 'running') {
        await loadRuns(latest.run ?? state.run?.id);
        if (state.view === 'data') await dataBrowser.load();
      }
    }
  }
  $('generate').disabled = state.busy || state.saving;
  if (wasBusy !== state.busy && !state.saving && !$('detail').open) renderRun();
}
$('generate').addEventListener('click', () => job('generate', 'live'));
$('browse-data').addEventListener('click', () => showData().catch((error) => notify(error.message)));
$('review').addEventListener('click', () => job('review'));
$('rebuild').addEventListener('click', () => job('generate', 'from'));
$('resume').addEventListener('click', () => job('generate', 'resume'));
$('apply').addEventListener('click', () => job('apply'));
$('refresh').addEventListener('click', () => loadRuns().catch((error) => notify(error.message)));
for (const button of document.querySelectorAll('[data-tab]')) button.addEventListener('click', () => { state.tab = button.dataset.tab; state.page = 0; state.selected.clear(); renderRun(); });
for (const id of ['search', 'category']) $(id).addEventListener('input', () => { state.page = 0; state.selected.clear(); renderItems(); });
$('previous').addEventListener('click', () => { state.page--; renderItems(); });
$('next').addEventListener('click', () => { state.page++; renderItems(); });
$('accept-selected').addEventListener('click', () => decide([...state.selected].map((id) => ({ id, status: 'accepted' }))));
$('previous-pending').addEventListener('click', () => navigatePending('previous'));
$('next-pending').addEventListener('click', () => navigatePending('next'));
$('close-detail').addEventListener('click', () => $('detail').close());
for (const button of document.querySelectorAll('[data-decision]')) button.addEventListener('click', () => decide([{ id: state.detail.id, status: button.dataset.decision, note: $('decision-note').value }], button.dataset.next === 'true'));
async function start() {
  renderView();
  try {
    state.token = (await api('/api/session')).token;
    if (state.view === 'data') await showData();
    await loadRuns(); await pollJobs();
  }
  catch (error) { notify(error.message); }
  const poll = async () => { try { await pollJobs(); } catch (error) { notify(error.message); } finally { setTimeout(poll, 2500); } };
  setTimeout(poll, 2500);
}
void start();
