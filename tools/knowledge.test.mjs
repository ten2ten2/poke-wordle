import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createFixture } from './test-fixture.mjs';
import { createKnowledgeManager } from './knowledge-model.mjs';
import { inspectMdx } from './knowledge-mdx.mjs';

const newVersion = (title = '测试文章', slug = '测试文章') => ({ title, slug, description: `${title}的摘要`, createdAt: '2025-06-06T00:00:00Z', source: '<Question>问题</Question>\n<Answer>\n**答案**\n</Answer>\n' });

test('renames retain direct aliases, reserve old paths, and clean up aliases on deletion', async (t) => {
  const fixture = await createFixture(); t.after(fixture.cleanup);
  const manager = createKnowledgeManager({ root: fixture.dir });
  let model = await manager.list();
  const versionID = model.articles[0].versions.en.id;
  const rename = async (slug) => {
    const group = model.articles.find((article) => article.versions.en?.id === versionID);
    model = await manager.update({ action: 'save', revision: model.revision, articleId: group.id, locale: 'en', version: { ...group.versions.en, slug } });
  };
  await rename('version.2'); await rename('version-3');
  assert.deepEqual(model.redirects.map((alias) => alias.slug), ['example-article', 'version.2']);
  assert(model.redirects.every((alias) => alias.articleId === versionID));
  await assert.rejects(manager.update({ action: 'save', revision: model.revision, locale: 'en', version: newVersion('Collision', 'version.2') }), /历史地址/);
  await rename('example-article');
  assert.deepEqual(model.redirects.map((alias) => alias.slug), ['version.2', 'version-3']);
  await assert.rejects(rename('EXAMPLE-ARTICLE'), /大小写/);
  await manager.check();
  model = await manager.update({ action: 'deleteVersion', revision: model.revision, articleId: model.selectedArticleId, locale: 'en' });
  assert.deepEqual(model.redirects, []);
  await manager.check();
});

test('SEO fields persist, unchanged saves preserve lastmod, and invalid metadata cannot be saved', async (t) => {
  const fixture = await createFixture(); t.after(fixture.cleanup);
  const manager = createKnowledgeManager({ root: fixture.dir });
  let model = await manager.list();
  const write = (version) => manager.update({ action: 'save', revision: model.revision, articleId: model.articles[0].id, locale: 'en', version });
  const initial = model.articles[0].versions.en;
  const unchanged = await write(initial);
  assert.equal(unchanged.revision, model.revision);
  assert.equal(unchanged.articles[0].versions.en.updatedAt, undefined);
  model = await write({ ...initial, description: 'Specific English summary', seoTitle: 'Custom title', image: '/images/og-image.png' });
  const saved = model.articles[0].versions.en;
  assert.equal(saved.description, 'Specific English summary'); assert.equal(saved.seoTitle, 'Custom title');
  assert.equal(saved.image, '/images/og-image.png'); assert(saved.updatedAt);
  const again = await write(saved); assert.equal(again.revision, model.revision); assert.equal(again.articles[0].versions.en.updatedAt, saved.updatedAt);
  for (const change of [{ description: '' }, { description: 'x'.repeat(601) }, { seoTitle: 'x'.repeat(201) }, { image: 'javascript:alert(1)' }, { image: 'https://example.org/not-an-image' }, { image: '/images/missing.png' }, { image: '/images/../../src/data/pokemon_data.json' }, { createdAt: '2999-01-01T00:00:00Z' }]) {
    await assert.rejects(write({ ...saved, ...change }));
  }
  assert.equal((await manager.list()).revision, model.revision);
  model = await write({ ...saved, seoTitle: '', image: '' });
  assert.equal(model.articles[0].versions.en.seoTitle, undefined); assert.equal(model.articles[0].versions.en.image, undefined);
});

test('manual changes to aliases participate in the revision check and invalid aliases fail validation', async (t) => {
  const fixture = await createFixture(); t.after(fixture.cleanup);
  const manager = createKnowledgeManager({ root: fixture.dir });
  const model = await manager.list(); const article = model.articles[0];
  const alias = { locale: 'en', slug: 'previous-name', articleId: article.versions.en.id };
  const file = path.join(fixture.data, 'knowledge-redirects.json');
  await fs.writeFile(file, JSON.stringify([alias]));
  await assert.rejects(manager.update({ action: 'save', revision: model.revision, articleId: article.id, locale: 'en', version: article.versions.en }), /其他窗口/);
  for (const aliases of [[alias, alias], [{ ...alias, articleId: 'missing' }], [{ ...alias, slug: article.versions.en.slug }]]) {
    await fs.writeFile(file, JSON.stringify(aliases)); await assert.rejects(manager.check());
  }
});

test('knowledge CRUD keeps MDX files, translations and compiled loaders consistent', async (t) => {
  const fixture = await createFixture(); t.after(fixture.cleanup);
  const manager = createKnowledgeManager({ root: fixture.dir });
  let model = await manager.list(); assert.equal(model.articles.length, 1); assert.equal(Object.keys(model.articles[0].versions).length, 4);
  const original = model.articles[0];
  const write = async (body) => { model = await manager.update({ revision: model.revision, ...body }); return model; };
  await write({ action: 'save', articleId: null, locale: 'zh-hans', version: newVersion() });
  let id = model.selectedArticleId; assert.equal(model.articles.length, 2);
  await write({ action: 'save', articleId: id, locale: 'en', version: newVersion('Test article', 'test-article') });
  id = model.selectedArticleId;
  let group = model.articles.find((item) => item.id === id);
  assert.equal(Object.keys(group.versions).length, 2);
  assert.equal(group.versions.en.translations['zh-hans'].slug, '测试文章');
  assert.equal(group.versions['zh-hans'].translations.en.slug, 'test-article');
  const renamed = { ...group.versions['zh-hans'], slug: '新的 路径', title: '新标题' };
  await write({ action: 'save', articleId: id, locale: 'zh-hans', version: renamed }); id = model.selectedArticleId;
  group = model.articles.find((item) => item.id === id);
  assert.equal(group.versions.en.translations['zh-hans'].slug, '新的 路径');
  assert.equal(await fs.readFile(path.join(fixture.data, 'knowledge/zh-hans/新的 路径.mdx'), 'utf8'), renamed.source);
  await assert.rejects(fs.access(path.join(fixture.data, 'knowledge/zh-hans/测试文章.mdx')));
  assert.deepEqual(await manager.check(), { articles: 2, versions: 6 });
  assert.match(await fs.readFile(path.join(fixture.data, 'knowledge-loaders.ts'), 'utf8'), /新的 路径\.mdx/);
  await write({ action: 'deleteVersion', articleId: id, locale: 'zh-hans' }); id = model.selectedArticleId;
  group = model.articles.find((item) => item.id === id); assert.deepEqual(group.versions.en.translations, {});
  await write({ action: 'deleteArticle', articleId: id });
  assert.equal(model.articles.length, 1);
  for (const [locale, version] of Object.entries(original.versions)) assert.equal(model.articles[0].versions[locale].source, version.source);
  assert.deepEqual(await manager.check(), { articles: 1, versions: 4 });
  await write({ action: 'deleteArticle', articleId: model.articles[0].id });
  assert.equal(model.articles.length, 0);
  assert.deepEqual(await manager.check(), { articles: 0, versions: 0 });
  await write({ action: 'save', articleId: null, locale: 'en', version: newVersion('Restarted article', 'restarted-article') });
  assert.deepEqual(await manager.check(), { articles: 1, versions: 1 });
});

test('stale edits, invalid MDX, duplicate paths and unsafe paths cannot overwrite articles', async (t) => {
  const fixture = await createFixture(); t.after(fixture.cleanup);
  const manager = createKnowledgeManager({ root: fixture.dir });
  const before = await manager.list(); const id = before.articles[0].id;
  const source = before.articles[0].versions.en;
  const request = { action: 'save', articleId: id, locale: 'en', revision: before.revision, version: { ...source, title: 'Updated title' } };
  const saved = await manager.update(request);
  assert.equal(saved.articles[0].versions.en.title, 'Updated title');
  assert.equal(saved.articles[0].versions.en.source, source.source);
  await assert.rejects(manager.update(request), /其他窗口/);
  for (const version of [{ ...source, slug: '../escape' }, { ...source, source: '<Question>unclosed' }, { ...source, source: '{process.exit(1)}' }]) {
    await assert.rejects(manager.update({ ...request, revision: saved.revision, version }));
  }
  await assert.rejects(manager.update({ ...request, articleId: null, revision: saved.revision }), /已存在路径/);
  assert.equal((await manager.list()).revision, saved.revision);
  await fs.appendFile(path.join(fixture.data, 'knowledge/en', `${source.slug}.mdx`), '\nManual edit\n');
  await assert.rejects(manager.update({ ...request, revision: saved.revision }), /其他窗口/);
  const fresh = await manager.list();
  await assert.rejects(manager.update({ ...request, revision: fresh.revision, locale: 'fr' }), /仅支持/);
  const outside = path.join(fixture.dir, 'outside.mdx'); await fs.writeFile(outside, 'Protected');
  await fs.symlink(outside, path.join(fixture.data, 'knowledge/en/linked.mdx'));
  await assert.rejects(manager.update({ ...request, revision: fresh.revision, version: { ...source, slug: 'linked' } }), /符号链接/);
  assert.equal(await fs.readFile(outside, 'utf8'), 'Protected');
});

test('static MDX preview supports existing components and never runs embedded JavaScript', async () => {
  assert.equal(await inspectMdx('{/* editorial note */}\n'), '');
  const html = await inspectMdx('<FAQ>\n<Question>标题</Question>\n<Answer>\n**回答** [来源](https://example.com)\n\n| A | B |\n| - | - |\n| 1 | 2 |\n</Answer>\n</FAQ>\n');
  assert.match(html, /<h2>标题<\/h2>/); assert.match(html, /<strong>回答<\/strong>/); assert.match(html, /<table>/); assert.doesNotMatch(html, /<script/);
  for (const source of ['# Duplicate title', '<h1>Duplicate title</h1>', '<JsonLd data={{"@type":"Article"}} />', 'export const x = 1', '{globalThis.injected = true}', '<script>alert(1)</script>', '<div onClick={() => 1}>x</div>', '<div {...globalThis} />', '<Unknown />', '[link](javascript:alert%281%29)', '<a href={"javascript:alert(1)"}>x</a>', '<JsonLd data={{get foo(){return 1}}} />']) await assert.rejects(inspectMdx(source));
  assert.equal(globalThis.injected, undefined);
});

test('MDX link hints preserve authored titles and derive missing titles from formatted labels', async () => {
  const html = await inspectMdx('[**宝可梦**资料](https://example.com)\n\n[资料](https://example.com "官方资料")\n\n<a href="/knowledge"><strong>知识</strong>文章</a>\n\n<a href="/knowledge" title="作者提示">文章</a>\n\n[![图鉴](/images/og-image.png)](/knowledge)');
  assert.match(html, /title="宝可梦资料"/);
  assert.match(html, /title="官方资料"/);
  assert.match(html, /title="知识文章"/);
  assert.match(html, /title="作者提示"/);
  assert.match(html, /title="图鉴"/);
});

test('console exposes knowledge editing and isolated preview with the existing session protection', async (t) => {
  const fixture = await createFixture(); t.after(fixture.cleanup);
  const { createConsole } = await import(pathToFileURL(path.join(fixture.tool, 'console.mjs')));
  const app = await createConsole({ port: 0 }); t.after(() => new Promise((resolve) => app.server.close(resolve)));
  const session = await (await fetch(`${app.url}/api/session`)).json();
  const post = (route, body, token = session.token) => fetch(app.url + route, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Console-Token': token }, body: JSON.stringify(body) });
  const model = await (await fetch(`${app.url}/api/knowledge`)).json();
  assert.equal(model.articles.length, 1);
  assert.equal((await post('/api/knowledge', {}, 'wrong')).status, 403);
  const preview = await post('/api/knowledge/preview', { locale: 'zh-hans', ...newVersion() }); assert.equal(preview.status, 200);
  const page = await fetch(app.url + (await preview.json()).url); assert.match(page.headers.get('content-security-policy'), /sandbox/); assert.match(await page.text(), /<strong>答案<\/strong>/);
  const response = await post('/api/knowledge', { action: 'save', articleId: null, locale: 'en', revision: model.revision, version: newVersion('New article', 'new-article') });
  assert.equal(response.status, 200); assert.equal((await response.json()).articles.length, 2);
  const published = await (await fetch(`${app.url}/api/current`)).json();
  assert(published.data['knowledge_data.json'].en.some((article) => article.slug === 'new-article'));
});
