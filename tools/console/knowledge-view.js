import { $, element, languages } from './shared.js';

const template = '<Question>在这里填写问题</Question>\n<Answer>\n在这里编写答案，支持 **Markdown**。\n</Answer>\n';
const localDate = (value) => { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const fields = { title: 'title', slug: 'slug', createdAt: 'created', description: 'description', seoTitle: 'seo-title', image: 'image', source: 'source' };
export function createKnowledgeEditor({ api, notify }) {
  const previewFrame = $('knowledge-preview-frame');
  // The opaque sandbox cannot read the parent's manual theme; reload the same static preview.
  function updatePreviewTheme(source = previewFrame.getAttribute('src')) {
    if (!source) return;
    const url = new URL(source, location.href);
    url.searchParams.set('theme', document.documentElement.dataset.theme ?? 'light');
    if (previewFrame.src !== url.href) previewFrame.src = url.href;
  }
  window.addEventListener('poke-wordle-theme-change', () => updatePreviewTheme());
  const state = { model: null, id: null, locale: 'zh-hans', editing: false, saved: '', working: false, generation: 0 };
  const article = () => state.model?.articles.find((item) => item.id === state.id);
  const version = () => article()?.versions[state.locale];
  const values = () => Object.fromEntries(Object.entries(fields).map(([name, id]) => [name, $(`knowledge-${id}`).value]));
  const fill = (values) => { for (const [name, id] of Object.entries(fields)) $(`knowledge-${id}`).value = values[name] ?? ''; };
  const dirty = () => state.editing && JSON.stringify(values()) !== state.saved;
  const canLeave = () => !state.working && (!dirty() || window.confirm('有未保存的 MDX 修改。确定放弃这些修改并离开吗？'));
  function sourceMode() { $('knowledge-source-panel').hidden = false; $('knowledge-preview-panel').hidden = true; $('knowledge-source-tab').setAttribute('aria-pressed', 'true'); $('knowledge-preview').setAttribute('aria-pressed', 'false'); }
  function status() {
    $('knowledge-dirty').textContent = state.working ? '正在处理…' : dirty() ? '有未保存修改' : version() ? '已保存到项目' : '尚未保存的新版本';
    const source = $('knowledge-source').value;
    $('knowledge-source-count').textContent = `${source.split('\n').length} 行 · ${source.length} 字符`;
    $('knowledge-path').textContent = `/${state.locale === 'en' ? '' : `${state.locale}/`}knowledge/${$('knowledge-slug').value || '路径名称'}`;
    const form = values();
    $('knowledge-search-title').textContent = form.seoTitle.trim() || `${form.title || '文章标题'} - Poke Wordle`;
    $('knowledge-search-url').textContent = `https://www.pokewordle.app/${state.locale === 'en' ? '' : `${state.locale}/`}knowledge/${encodeURIComponent(form.slug || 'article')}`;
    $('knowledge-search-description').textContent = form.description || '填写当前语言的文章摘要。';
    $('knowledge-copy-version').hidden = !article();
    $('knowledge-delete-version').disabled = !version() || state.working;
    $('knowledge-delete-article').disabled = !article() || state.working;
    for (const id of ['knowledge-save', 'knowledge-preview', 'knowledge-import', 'knowledge-copy-version', 'knowledge-new', 'knowledge-reload']) $(id).disabled = state.working;
  }
  function renderList() {
    if (!state.model) return;
    const query = $('knowledge-search').value.trim().toLowerCase();
    const rows = state.model.articles.filter((item) =>
      ($('knowledge-filter').value !== 'incomplete' || Object.keys(item.versions).length < state.model.locales.length)
      && (!query || Object.values(item.versions).some((value) => `${value.title} ${value.slug}`.toLowerCase().includes(query))));
    $('knowledge-list').replaceChildren(...rows.map((item) => {
      const button = element('button', undefined, 'knowledge-article-button btn-option');
      button.title = `编辑 ${item.title}`;
      button.setAttribute('aria-current', item.id === state.id ? 'page' : 'false');
      button.append(element('strong', item.title));
      const chips = element('span', undefined, 'knowledge-language-chips');
      for (const locale of state.model.locales) chips.append(element('span', languages[locale], `badge ${item.versions[locale] ? 'accepted' : ''}`));
      button.append(chips);
      button.addEventListener('click', () => { if (canLeave()) open(item.id, item.versions[state.locale] ? state.locale : Object.keys(item.versions)[0]); });
      return button;
    }));
    if (!rows.length) $('knowledge-list').append(element('p', '没有符合条件的文章。', 'empty'));
  }
  function open(id, locale = state.locale) {
    state.generation++; state.id = id; state.locale = locale; state.editing = true;
    const current = version();
    $('knowledge-empty').hidden = true; $('knowledge-editor').hidden = false;
    fill({ ...current, createdAt: localDate(current?.createdAt ?? new Date().toISOString()), source: current?.source ?? template });
    const redirects = (state.model.redirects ?? []).filter((alias) => alias.articleId === current?.id);
    $('knowledge-redirects').hidden = redirects.length === 0;
    $('knowledge-redirect-list').replaceChildren(...redirects.map((alias) => element('li', `/${alias.locale === 'en' ? '' : `${alias.locale}/`}knowledge/${alias.slug}`)));
    state.saved = JSON.stringify(values()); sourceMode();
    $('knowledge-languages').replaceChildren(...state.model.locales.map((language) => {
      const button = element('button', `${languages[language]}${article()?.versions[language] ? '' : ' ＋'}`, 'btn-option');
      button.setAttribute('aria-pressed', String(language === locale));
      button.addEventListener('click', () => { if (language !== state.locale && canLeave()) open(state.id, language); });
      return button;
    }));
    renderList(); status();
  }
  function setModel(model) {
    state.model = model;
    $('knowledge-status').textContent = `${model.articles.length} 篇文章 · ${model.articles.reduce((count, item) => count + Object.keys(item.versions).length, 0)} 个语言版本。保存会同步 MDX、索引和语言关联；部署后对外生效。`;
    renderList();
  }
  async function load() {
    const generation = ++state.generation;
    const initial = state.editing ? JSON.stringify(values()) : null;
    if (!state.editing) {
      $('knowledge-editor').hidden = true;
      $('knowledge-empty').hidden = false;
    }
    const model = await api('/api/knowledge'); if (generation !== state.generation) return;
    if (initial !== null && state.editing && JSON.stringify(values()) !== initial) { notify('载入期间有新修改，已保留编辑内容。请保存或导出后重试。'); return; }
    setModel(model);
    const selected = model.articles.find((item) => item.id === state.id) ?? model.articles[0];
    if (selected) open(selected.id, selected.versions[state.locale] ? state.locale : Object.keys(selected.versions)[0]);
    else { state.id = null; state.editing = false; $('knowledge-empty').hidden = false; $('knowledge-editor').hidden = true; }
  }
  async function work(callback) {
    if (state.working) return;
    state.working = true; status();
    try { await callback(); } catch (error) { notify(error.message); }
    finally { state.working = false; status(); }
  }
  async function preview() {
    await work(async () => {
      const source = values(); const generation = state.generation;
      const result = await api('/api/knowledge/preview', { locale: state.locale, title: source.title, source: source.source });
      if (generation !== state.generation || JSON.stringify(source) !== JSON.stringify(values())) { notify('正文已修改，请重新预览。'); return; }
      updatePreviewTheme(result.url);
      $('knowledge-source-panel').hidden = true; $('knowledge-preview-panel').hidden = false;
      $('knowledge-source-tab').setAttribute('aria-pressed', 'false'); $('knowledge-preview').setAttribute('aria-pressed', 'true');
      $('knowledge-preview-status').textContent = 'MDX 校验通过。这是未保存的正文预览。';
    });
  }
  async function save() {
    if (!$('knowledge-form').reportValidity()) return;
    await work(async () => {
      const form = values(); const original = version();
      const createdAt = original && form.createdAt === localDate(original.createdAt) ? original.createdAt : new Date(form.createdAt).toISOString();
      const result = await api('/api/knowledge', { action: 'save', articleId: state.id, locale: state.locale, revision: state.model.revision, version: { ...form, createdAt } });
      // Keep edits typed while the request was outstanding instead of replacing them.
      const edited = JSON.stringify(form) !== JSON.stringify(values());
      const latest = values(); setModel(result); open(result.selectedArticleId, state.locale);
      if (edited) {
        fill(latest);
      }
      notify(edited ? '提交时的内容已保存，后续输入仍待保存。' : '文章已保存到项目，知识库、语言关联与随机问答已同步。');
    });
  }
  async function remove(action) {
    const name = article()?.title; if (!name || state.working) return;
    const message = action === 'deleteArticle' ? `删除「${name}」及全部语言版本？对应 MDX 文件也会删除。` : `删除「${name}」的${languages[state.locale]}版本？对应 MDX 文件也会删除。`;
    if (!window.confirm(`${message}${dirty() ? '\n未保存的修改也会丢弃。' : ''}`)) return;
    await work(async () => {
      const result = await api('/api/knowledge', { action, articleId: state.id, locale: state.locale, revision: state.model.revision });
      state.editing = false; setModel(result);
      const selected = result.articles.find((item) => item.id === result.selectedArticleId) ?? result.articles[0];
      if (selected) open(selected.id, selected.versions[state.locale] ? state.locale : Object.keys(selected.versions)[0]);
      else { state.id = null; $('knowledge-empty').hidden = false; $('knowledge-editor').hidden = true; }
      notify('文章版本与对应语言关联已更新。');
    });
  }
  $('knowledge-search').addEventListener('input', renderList);
  $('knowledge-filter').addEventListener('change', renderList);
  $('knowledge-new').addEventListener('click', () => { if (state.model && canLeave()) { open(null, 'zh-hans'); $('knowledge-title').focus(); } });
  $('knowledge-reload').addEventListener('click', () => { if (canLeave()) load().catch((error) => notify(error.message)); });
  $('knowledge-source-tab').addEventListener('click', sourceMode);
  $('knowledge-preview').addEventListener('click', preview);
  $('knowledge-form').addEventListener('submit', (event) => { event.preventDefault(); void save(); });
  $('knowledge-form').addEventListener('input', () => { status(); if (!$('knowledge-preview-panel').hidden) $('knowledge-preview-status').textContent = '内容已修改，请重新预览并校验。'; });
  $('knowledge-source').addEventListener('keydown', (event) => {
    if (event.key === 'Tab' && !event.ctrlKey && !event.metaKey) { event.preventDefault(); const editor = event.currentTarget; editor.setRangeText('  ', editor.selectionStart, editor.selectionEnd, 'end'); status(); }
  });
  $('knowledge-import').addEventListener('click', () => $('knowledge-file').click());
  $('knowledge-file').addEventListener('change', async () => {
    const file = $('knowledge-file').files[0]; $('knowledge-file').value = '';
    if (!file || !canLeave()) return;
    if (file.size > 512000) return notify('MDX 文件不能超过 500 KB');
    const generation = state.generation; const initial = JSON.stringify(values());
    const source = await file.text(); if (generation !== state.generation || JSON.stringify(values()) !== initial) return;
    $('knowledge-source').value = source; sourceMode(); status();
  });
  $('knowledge-export').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([$('knowledge-source').value], { type: 'text/mdx;charset=utf-8' }));
    const link = element('a'); link.href = url; link.download = `${$('knowledge-slug').value || 'article'}.${state.locale}.mdx`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('knowledge-copy-version').addEventListener('click', () => {
    const original = Object.values(article()?.versions ?? {}).find((item) => item.locale !== state.locale);
    if (!original) return notify('还没有其他语言版本可以复制。');
    if (!window.confirm(`复制${languages[original.locale]}的 MDX 正文到当前编辑器？请翻译后再保存。`)) return;
    $('knowledge-source').value = original.source; sourceMode(); status();
  });
  $('knowledge-delete-version').addEventListener('click', () => remove('deleteVersion'));
  $('knowledge-delete-article').addEventListener('click', () => remove('deleteArticle'));
  window.addEventListener('beforeunload', (event) => { if (dirty()) { event.preventDefault(); event.returnValue = ''; } });
  document.addEventListener('keydown', (event) => { if (!$('knowledge-manager').hidden && state.editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void save(); } });
  return { load, canLeave, dirty, deactivate: () => { state.editing = false; state.generation++; } };
}
