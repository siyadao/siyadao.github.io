import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../i18n.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function load() {
  const window = {};
  vm.runInNewContext(source, {
    window,
    document: undefined,
    localStorage: undefined,
    location: undefined,
    history: undefined,
    CustomEvent: function CustomEvent() {},
    NodeFilter: {},
    URL,
    URLSearchParams,
  });
  return window.SiyadaoI18n;
}

const allow = new Set(['思芽岛', '粤ICP备2026108587号-1']);

function chinesePieces(markup) {
  const visible = markup
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  const found = new Set();
  const attributes = /(?:alt|aria-label|title|content|data-title|data-description)="([^"]*)"/g;
  for (const match of visible.matchAll(attributes)) {
    if (/[\u4e00-\u9fff]/.test(match[1])) found.add(match[1]);
  }
  const stripped = visible.replace(/<[^>]+>/g, '\n');
  for (const part of stripped.split('\n')) {
    const text = part.replace(/\s+/g, ' ').trim();
    if (/[\u4e00-\u9fff]/.test(text)) found.add(text);
  }
  return found;
}

test('语言选择以地址参数为准，否则用已保存的选择，默认中文', () => {
  const api = load();
  assert.equal(api.resolveLang({}), 'zh');
  assert.equal(api.resolveLang({ stored: 'en' }), 'en');
  assert.equal(api.resolveLang({ stored: 'en', query: 'zh' }), 'zh');
  assert.equal(api.resolveLang({ stored: 'nope', query: 'en' }), 'en');
  assert.equal(api.resolveLang({ query: 'fr' }), 'zh');
});

test('英文对照不冲突，且能把已知中文换成英文', () => {
  const api = load();
  const seen = new Map();
  for (const [key, value] of api.catalog) {
    assert.equal(typeof value, 'string');
    assert.ok(value.trim(), key);
    if (seen.has(key)) assert.equal(seen.get(key), value, key);
    seen.set(key, value);
  }
  assert.equal(api.translate('zh', '应用下载'), '应用下载');
  assert.equal(api.translate('en', '应用下载'), 'Download');
  assert.equal(api.translate('en', '没有这条'), '没有这条');
});

test('页面上的中文都有英文对照，品牌名和备案号保持原文', () => {
  const api = load();
  const known = new Set(api.catalog.map(([key]) => key));
  const missing = [...chinesePieces(html)].filter((text) => !known.has(text) && !allow.has(text));
  assert.deepEqual(missing, []);
});

test('下载菜单和主题按钮使用的句子都有英文', () => {
  const api = load();
  const known = new Set(api.catalog.map(([key]) => key));
  const required = [
    '切换到浅色主题', '切换到深色主题', '正在准备…', '查询中', '暂不可用', '暂无安装包',
    'GitHub 下载', '官网下载', '官网备用下载', '备用', '正在获取最新版本…',
    '暂时无法刷新，当前显示上次获取的版本。', '各平台使用各自最新可用版本。',
    '官方发布 · 测试版', '官方发布 · 稳定版', '暂未获取到公开版本。', '暂时无法获取版本，请稍后重试。',
    'macOS（M 芯片）', 'macOS（Intel）', 'Windows（x86_64）', 'Windows（ARM64）',
    'Linux（x86_64）', 'Linux（ARM64）',
  ];
  assert.deepEqual(required.filter((key) => !known.has(key)), []);
});
