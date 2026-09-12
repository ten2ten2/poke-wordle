import { $, element, languages, fields } from './shared.js';
const kinds = { pokemon: '宝可梦', ability: '特性', type: '属性', other: '其他' };
const collections = { pokemon: '宝可梦', translations: '多语言名称', images: '恶作剧图片', knowledge: '知识文章索引' };
const searchText = (value) => String(value).normalize('NFKC').toLowerCase();
const spriteID = (url) => url?.match(/\/(\d+)\.(?:png|gif)$/)?.[1];
const jsonDetails = (data) => {
  const node = element('details', undefined, 'data-json');
  node.append(element('summary', '查看原始 JSON'), element('pre', JSON.stringify(data, null, 2)));
  return node;
};
function image(url, name) {
  if (!url?.startsWith('https://raw.githubusercontent.com/')) return element('span', '—');
  const img = element('img'); img.src = url; img.alt = name; img.loading = 'lazy'; img.width = 64; img.height = 64;
  return img;
}
function facts(entries) {
  const list = element('dl', undefined, 'data-facts');
  for (const [key, value] of entries) list.append(element('dt', key), element('dd', String(value ?? '—')));
  return list;
}

export function createDataBrowser({ api, notify }) {
  const state = { snapshot: null, tab: 'pokemon', page: 0, rows: {}, request: 0 };
  const locale = () => $('data-locale').value;
  const names = (key) => state.snapshot.data['pokemon_i18n.json'][key] ?? {};
  const label = (key) => names(key)[locale()] ?? names(key)['zh-hans'] ?? key;
  const words = (keys) => (keys ?? []).map(label).join(' · ') || '无';
  const translatedWords = (keys) => (keys ?? []).flatMap((key) => [key, ...Object.values(names(key))]);
  function format(key, value) {
    if (value === '' || value === null || value === undefined) return '—';
    if (key === 'types' || key === 'abilities') return words(value);
    if (key === 'tags') return value.map((tag) => state.snapshot.messages.tags[tag] ?? tag).join(' · ') || '无';
    if (key === 'evolution_method_detail') return state.snapshot.messages.evolutionMethods[value] ?? value;
    if (key === 'evolution_method') return ({ level: '升级', item: '道具', trade: '连接交换', unique: '特殊方式' })[value] ?? value;
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
  function populate(id, values, title, display = (value) => value) {
    const select = $(id); const previous = select.value;
    select.replaceChildren(new Option(title, 'all'), ...values.map((value) => new Option(display(value), String(value))));
    select.value = [...select.options].some((option) => option.value === previous) ? previous : 'all';
  }
  function prepare() {
    const data = state.snapshot.data; const pokemon = data['pokemon_data.json'];
    const pokemonNames = new Set(pokemon.map((row) => row.name));
    const abilities = new Set(pokemon.flatMap((row) => row.abilities));
    const types = new Set(pokemon.flatMap((row) => row.types));
    const bySprite = new Map(pokemon.map((row) => [spriteID(row.profile), row]));
    state.rows.pokemon = pokemon.toSorted((a, b) => a.pokedex_id_national - b.pokedex_id_national || a.id - b.id).map((row) => ({ row, search: searchText([row.name, ...Object.values(names(row.name)), ...translatedWords(row.abilities), ...translatedWords(row.types), format('tags', row.tags), format('evolution_method_detail', row.evolution_method_detail)].join(' ')) }));
    state.rows.translations = Object.entries(data['pokemon_i18n.json']).sort(([a], [b]) => a.localeCompare(b)).map(([key, row]) => ({ key, row, kind: pokemonNames.has(key) ? 'pokemon' : abilities.has(key) ? 'ability' : types.has(key) ? 'type' : 'other', search: searchText([key, ...Object.values(row)].join(' ')) }));
    state.rows.images = data['prankster_profile.json'].map((url) => {
      const pokemon = bySprite.get(spriteID(url));
      return { url, pokemon, search: searchText([url, pokemon?.name, pokemon?.pokedex_id_national, ...Object.values(names(pokemon?.name))].join(' ')) };
    });
    state.rows.knowledge = Object.entries(data['knowledge_data.json']).flatMap(([locale, rows]) => rows.map((row) => ({ row, locale, search: searchText(JSON.stringify(row)) })));
    populate('data-generation', [...new Set(pokemon.map((row) => row.generation))].sort((a, b) => a - b), '所有世代', (value) => `第 ${value} 世代`);
    populate('data-type', [...types].sort(), '所有属性', label);
    populate('data-tag', [...new Set(pokemon.flatMap((row) => row.tags ?? []))].sort(), '所有标签', (value) => state.snapshot.messages.tags[value] ?? value);
  }
  function filtered() {
    const query = searchText($('data-search').value.trim());
    const terms = query.split(/\s+/).filter(Boolean);
    const generation = $('data-generation').value;
    const type = $('data-type').value;
    const tag = $('data-tag').value;
    const kind = $('data-kind').value;
    const dex = /^#?\d+$/.test(query) ? Number(query.replace('#', '')) : null;
    return state.rows[state.tab].filter((item) => {
      if (state.tab === 'pokemon') {
        const row = item.row;
        if (generation !== 'all' && String(row.generation) !== generation) return false;
        if (type !== 'all' && !row.types.includes(type)) return false;
        if (tag !== 'all' && !row.tags?.includes(tag)) return false;
        if (dex !== null) return row.pokedex_id_national === dex;
      }
      if (state.tab === 'translations' && kind !== 'all' && item.kind !== kind) return false;
      return terms.every((term) => item.search.includes(term));
    });
  }
  function nameBlock(title, subtitle) {
    const node = element('span', undefined, 'data-name'); node.append(element('strong', title), element('small', subtitle)); return node;
  }
  function openDetail(item) {
    const body = $('data-detail-body'); body.replaceChildren();
    $('data-detail-category').textContent = collections[state.tab];
    let title; let subtitle;
    if (state.tab === 'pokemon') {
      const row = item.row; title = label(row.name); subtitle = `#${String(row.pokedex_id_national).padStart(4, '0')} · ${row.name}`;
      const hero = element('div', undefined, 'data-hero'); hero.append(image(row.profile, title), facts([['属性', words(row.types)], ['特性', words(row.abilities)], ['种族值总和', row.base_stats_total]])); body.append(hero);
      body.append(element('h3', '完整字段'), facts(Object.entries(row).filter(([key]) => !['profile', 'base_stats'].includes(key)).map(([key, value]) => [fields[key] ?? key, format(key, value)])));
      body.append(element('h3', '六项种族值'), facts(Object.entries(row.base_stats).map(([key, value]) => [fields[key] ?? key, value])));
      body.append(element('h3', '多语言名称'), facts(Object.entries(names(row.name)).map(([key, value]) => [languages[key] ?? key, value])));
      body.append(jsonDetails(row));
    } else if (state.tab === 'translations') {
      title = label(item.key); subtitle = `${kinds[item.kind]} · ${item.key}`;
      body.append(facts(Object.entries(item.row).map(([key, value]) => [languages[key] ?? key, value])), jsonDetails({ [item.key]: item.row }));
    } else if (state.tab === 'images') {
      title = item.pokemon ? label(item.pokemon.name) : `图片 ${spriteID(item.url) ?? ''}`; subtitle = item.pokemon?.name ?? '';
      body.append(image(item.url, title));
      const link = element('a', '打开原始图片 ↗');
      if (item.url.startsWith('https://raw.githubusercontent.com/')) { link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      body.append(element('p', item.url, 'data-url'), link, jsonDetails(item.url));
    } else {
      title = item.row.title; subtitle = `${languages[item.locale] ?? item.locale} · ${item.row.id}`;
      body.append(facts(Object.entries(item.row).filter(([key]) => key !== 'translations').map(([key, value]) => [fields[key] ?? key, format(key, value)])));
      body.append(element('h3', '关联语言'), facts(Object.entries(item.row.translations ?? {}).map(([key, value]) => [languages[key] ?? key, value.slug])), jsonDetails(item.row));
    }
    $('data-detail-title').textContent = title; $('data-detail-subtitle').textContent = subtitle;
    $('data-detail').showModal(); $('data-detail').scrollTop = 0;
  }
  function record(item) {
    const node = element('button', undefined, `data-record ${state.tab}`);
    if (state.tab === 'pokemon') {
      const row = item.row; const title = label(row.name);
      const lead = element('span', undefined, 'data-lead'); lead.append(image(row.profile, ''), nameBlock(title, `#${String(row.pokedex_id_national).padStart(4, '0')} · ${row.name}`));
      node.append(lead, nameBlock(words(row.types), `第 ${row.generation} 世代`), nameBlock(words(row.abilities), `种族值 ${row.base_stats_total}`));
      node.setAttribute('aria-label', `查看 ${title}`);
    } else if (state.tab === 'translations') {
      node.setAttribute('aria-label', `查看 ${label(item.key)} 的多语言名称`);
      node.append(nameBlock(label(item.key), `${kinds[item.kind]} · ${item.key}`), nameBlock(item.row.en ?? '—', item.row.ja ?? '—'));
    } else if (state.tab === 'images') {
      const title = item.pokemon ? label(item.pokemon.name) : `图片 ${spriteID(item.url) ?? ''}`;
      node.setAttribute('aria-label', `查看 ${title}`);
      node.append(image(item.url, ''), nameBlock(title, item.pokemon?.name ?? item.url));
    } else {
      node.setAttribute('aria-label', `查看 ${item.row.title}`);
      node.append(nameBlock(item.row.title, item.row.slug), nameBlock(languages[item.locale] ?? item.locale, item.row.id));
    }
    node.title = node.getAttribute('aria-label');
    node.append(element('span', '查看 ›', 'data-open')); node.addEventListener('click', () => openDetail(item)); return node;
  }
  function render() {
    if (!state.snapshot) return;
    for (const button of document.querySelectorAll('[data-collection]')) button.setAttribute('aria-pressed', String(button.dataset.collection === state.tab));
    for (const node of document.querySelectorAll('[data-pokemon-filter]')) node.hidden = state.tab !== 'pokemon';
    $('data-kind-filter').hidden = state.tab !== 'translations';
    $('data-locale').parentElement.hidden = state.tab === 'knowledge';
    const matches = filtered(); const size = 30; const pages = Math.max(1, Math.ceil(matches.length / size));
    state.page = Math.min(state.page, pages - 1);
    $('data-result-count').textContent = `${matches.length} / ${state.rows[state.tab].length} 项`;
    $('data-rows').className = state.tab === 'images' ? 'data-gallery' : '';
    $('data-rows').replaceChildren(...matches.slice(state.page * size, (state.page + 1) * size).map(record));
    if (!matches.length) $('data-rows').append(element('div', '没有符合条件的数据。可以更换关键词或清除筛选。', 'empty'));
    $('data-page-label').textContent = `${state.page + 1} / ${pages} 页`;
    $('data-previous').disabled = state.page === 0; $('data-next').disabled = state.page + 1 >= pages;
  }
  async function load() {
    const request = ++state.request;
    $('data-refresh').disabled = true; $('data-status').textContent = '正在读取当前数据…'; $('data-content').hidden = true;
    try {
      const snapshot = await api('/api/current'); if (request !== state.request) return;
      state.snapshot = snapshot; prepare();
      const pokemon = snapshot.data['pokemon_data.json'];
      const counts = [[`宝可梦 · ${new Set(pokemon.map((row) => row.pokedex_id_national)).size} 种族`, pokemon.length], ['多语言名称', state.rows.translations.length], ['恶作剧图片', state.rows.images.length], ['文章索引', state.rows.knowledge.length]];
      $('data-stats').replaceChildren(...counts.map(([name, count]) => { const node = element('div'); node.append(element('span', name), element('strong', count)); return node; }));
      $('data-status').textContent = `${snapshot.integrity.valid ? '三份游戏数据与发布版本一致' : snapshot.integrity.issues.join('；')} · 读取于 ${new Date(snapshot.read_at).toLocaleString('zh-CN', { hour12: false })}`;
      $('data-status').classList.toggle('data-warning', !snapshot.integrity.valid);
      $('data-metadata').textContent = JSON.stringify(snapshot.data['dataset.json'], null, 2);
      $('data-content').hidden = false; render();
    } catch (error) { if (request === state.request) { $('data-status').textContent = `读取失败：${error.message}`; notify(error.message); } }
    finally { if (request === state.request) $('data-refresh').disabled = false; }
  }
  $('data-locale').replaceChildren(...Object.entries(languages).map(([value, title]) => new Option(title, value)));
  $('data-refresh').addEventListener('click', load);
  $('close-data-detail').addEventListener('click', () => $('data-detail').close());
  $('data-previous').addEventListener('click', () => { state.page--; render(); });
  $('data-next').addEventListener('click', () => { state.page++; render(); });
  for (const button of document.querySelectorAll('[data-collection]')) button.addEventListener('click', () => { state.tab = button.dataset.collection; state.page = 0; $('data-search').value = ''; render(); });
  for (const id of ['data-search', 'data-generation', 'data-type', 'data-tag', 'data-kind']) $(id).addEventListener('input', () => { state.page = 0; render(); });
  $('data-locale').addEventListener('change', () => {
    if (!state.snapshot) return;
    for (const option of $('data-type').options) if (option.value !== 'all') option.textContent = label(option.value);
    render();
  });
  $('data-reset').addEventListener('click', () => {
    $('data-search').value = '';
    for (const id of ['data-generation', 'data-type', 'data-tag', 'data-kind']) $(id).value = 'all';
    state.page = 0; render();
  });
  return { load };
}
