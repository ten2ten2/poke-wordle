import assert from 'node:assert/strict';
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const tags = new Set('a abbr b blockquote br caption circle code dd del details div dl dt em figcaption figure g h1 h2 h3 h4 h5 h6 hr i img kbd li line ol p path polygon polyline pre rect s section small span strong sub summary sup svg table tbody td th thead tr ul'.split(' '));
const components = new Map([['FAQ', 'section'], ['Question', 'h2'], ['Answer', 'div']]);
const fail = (node, message) => { const position = node.position?.start; throw new Error(`${position ? `第 ${position.line} 行，第 ${position.column} 列：` : ''}${message}`); };

function literal(node, owner) {
  if (!node) fail(owner, '表达式不能为空');
  if (node.type === 'Program' && node.body.length === 1 && node.body[0].type === 'ExpressionStatement') return literal(node.body[0].expression, owner);
  if (node.type === 'Literal' && (node.value === null || ['string', 'number', 'boolean'].includes(typeof node.value))) return node.value;
  if (node.type === 'ArrayExpression') return node.elements.map((item) => literal(item, owner));
  if (node.type === 'UnaryExpression' && ['-', '+'].includes(node.operator)) { const value = literal(node.argument, owner); if (typeof value === 'number') return node.operator === '-' ? -value : value; }
  if (node.type === 'ObjectExpression') {
    const result = Object.create(null);
    for (const property of node.properties) {
      if (property.type !== 'Property' || property.computed || property.method || property.shorthand || property.kind !== 'init') fail(owner, '对象只支持静态键值');
      const key = property.key.name ?? property.key.value;
      if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key)) fail(owner, '对象属性无效');
      result[key] = literal(property.value, owner);
    }
    return result;
  }
  fail(owner, '文章支持静态 MDX；不支持执行 JavaScript、导入模块或调用函数');
}
function checkURL(value, node) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value) || value.trim().startsWith('//')) fail(node, '链接或图片地址无效');
  let url;
  try { url = new URL(value, 'https://knowledge.invalid/'); } catch { fail(node, '链接或图片地址无效'); }
  if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) fail(node, '链接或图片需要 http(s)、mailto、锚点或相对路径');
}
function attributes(node) {
  const props = {};
  for (const attribute of node.attributes ?? []) {
    if (attribute.type !== 'mdxJsxAttribute' || typeof attribute.name !== 'string') fail(node, '不支持展开属性');
    const name = attribute.name;
    if (/^on/i.test(name) || ['dangerouslySetInnerHTML', 'srcDoc', 'ref', 'key', '__proto__', 'constructor', 'prototype'].includes(name)) fail(node, `不支持属性 ${name}`);
    const value = attribute.value === null ? true : typeof attribute.value === 'string' ? attribute.value : literal(attribute.value.data?.estree, node);
    if (['href', 'src', 'xlinkHref'].includes(name)) checkURL(value, node);
    if (name === 'style' && (!value || typeof value !== 'object' || Array.isArray(value))) fail(node, 'style 必须是静态对象');
    props[name] = value;
  }
  return props;
}
function staticChildren(value, node) {
  if (Array.isArray(value)) return value.map((child) => staticChildren(child, node));
  if (value !== null && typeof value === 'object') fail(node, '正文表达式只能显示文字或数字');
  return value;
}
function expression(node) {
  if (!node.value.trim() || node.data?.estree?.body.length === 0) return null;
  return staticChildren(literal(node.data?.estree, node), node);
}
function validateTree() {
  return (tree) => {
    function visit(node) {
      if (node.type === 'mdxjsEsm') fail(node, '请直接使用内置组件，文章不支持 import/export');
      if (node.type === 'heading' && node.depth === 1 || node.name === 'h1') fail(node, '页面已包含文章标题，正文请从二级标题（##）开始');
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        if (node.name === 'JsonLd') fail(node, '结构化数据由文章索引自动生成，请移除 MDX 中的 JsonLd');
        if (node.name && !tags.has(node.name) && !components.has(node.name)) fail(node, `未知组件 ${node.name}；可使用 FAQ、Question、Answer 和静态 HTML`);
        attributes(node);
      }
      if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
        expression(node);
      }
      if (['link', 'image', 'definition'].includes(node.type)) checkURL(node.url, node);
      for (const child of node.children ?? []) visit(child);
    }
    visit(tree);
  };
}
function previewNode(node, index = 0) {
  if (node.type === 'text') return node.value;
  if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') return expression(node);
  const children = node.children?.map(previewNode);
  if (node.type === 'root') return createElement(Fragment, null, children);
  let name, props;
  if (node.type === 'element') {
    name = node.tagName;
    props = Object.fromEntries(Object.entries(node.properties ?? {}).map(([key, value]) => [key.replace(/^(data|aria)([A-Z].*)$/, (_, prefix, rest) => `${prefix}-${rest.replace(/[A-Z]/g, (letter, offset) => `${offset ? '-' : ''}${letter.toLowerCase()}`)}`), Array.isArray(value) ? value.join(' ') : value]));
  } else if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
    name = node.name ? components.get(node.name) ?? node.name : Fragment;
    props = attributes(node);
  } else return null;
  if (name === 'a') props = { ...props, target: '_blank', rel: 'noopener noreferrer' };
  return createElement(name, { ...props, key: index }, ...(children ?? []));
}

export async function inspectMdx(source) {
  assert(typeof source === 'string' && source.trim(), 'MDX 正文不能为空');
  assert(Buffer.byteLength(source) <= 512000, 'MDX 正文不能超过 500 KB');
  let html;
  try {
    await compile(source, {
      format: 'mdx', remarkPlugins: [remarkGfm, validateTree],
      rehypePlugins: [() => (tree) => { html = renderToStaticMarkup(previewNode(tree)); }],
    });
  } catch (error) {
    if (error.line) throw new Error(`第 ${error.line} 行，第 ${error.column ?? 1} 列：${error.reason ?? error.message}`);
    throw error;
  }
  return html;
}
