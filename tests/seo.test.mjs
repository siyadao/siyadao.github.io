import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleEnglishSite, readSiteFiles } from '../scripts/assemble-english-site.mjs';
import { catalogFromSource, renderEnglishHtml } from '../scripts/render-english-site.mjs';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const robots = fs.readFileSync(new URL('robots.txt', root), 'utf8');
const sitemap = fs.readFileSync(new URL('sitemap.xml', root), 'utf8');

test('首页带有分享信息和软件结构化数据', () => {
  for (const marker of [
    'property="og:title"',
    'property="og:image" content="https://studio.siyadao.cn/public/og.png"',
    'property="og:image:width" content="1200"',
    'property="og:image:height" content="630"',
    'name="twitter:card" content="summary_large_image"',
    'type="application/ld+json"',
    '"@type": "SoftwareApplication"',
    '"downloadUrl": "https://studio.siyadao.cn/#downloads"',
  ]) {
    assert.ok(html.includes(marker), marker);
  }
});

test('robots 允许抓取并指向 sitemap', () => {
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/studio\.siyadao\.cn\/sitemap\.xml$/m);
});

test('sitemap 收录中文首页和英文地址', () => {
  assert.ok(sitemap.includes('<loc>https://studio.siyadao.cn/</loc>'));
  assert.ok(sitemap.includes('<loc>https://siyadao.github.io/</loc>'));
  assert.ok(html.includes('hreflang="en" href="https://siyadao.github.io/"'));
  assert.ok(html.includes('href="https://siyadao.github.io/"'));
  assert.ok(sitemap.includes('hreflang="zh-CN"'));
  assert.ok(sitemap.includes('hreflang="en"'));
  assert.ok(sitemap.includes('hreflang="x-default"'));
});

test('英文站正文是英文，并链回中文站', () => {
  const messages = catalogFromSource(fs.readFileSync(new URL('i18n.js', root), 'utf8'));
  const english = renderEnglishHtml(html, messages);
  assert.match(english, /<html data-lang="en" lang="en"/);
  assert.match(english, /<title>Siyadao — Ideas, as they happen<\/title>/);
  assert.match(english, /rel="canonical" href="https:\/\/siyadao\.github\.io\/"/);
  assert.match(english, /data-lang-toggle[^>]*href="https:\/\/studio\.siyadao\.cn\/"[^>]*>中文<\/a>/);
  assert.match(english, /hreflang="zh-CN" href="https:\/\/studio\.siyadao\.cn\/"/);
  assert.equal(english.includes('让想法，即刻发生'), false);
});

test('分享图是 1200×630', () => {
  const png = fs.readFileSync(new URL('public/og.png', root));
  assert.equal(png.subarray(12, 16).toString(), 'IHDR');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test('公开文件清单覆盖页面引用', () => {
  const rootDir = fileURLToPath(root);
  const files = readSiteFiles(rootDir);
  const listed = new Set(files);
  const page = [
    html,
    fs.readFileSync(new URL('app.js', root), 'utf8'),
    fs.readFileSync(new URL('styles.css', root), 'utf8'),
  ].join('\n');
  for (const rel of files) {
    assert.equal(rel.includes('..'), false);
    assert.equal(rel.startsWith('/'), false);
    assert.ok(fs.existsSync(path.join(rootDir, rel)), rel);
  }
  assert.equal(listed.has('public/releases/v0.1.0-preview.1.json'), false);
  for (const match of page.matchAll(/public\/[A-Za-z0-9_./-]+/g)) {
    assert.ok(listed.has(match[0]), match[0]);
  }
});

test('英文目录使用渲染后的首页', () => {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'siyadao-en-'));
  try {
    assembleEnglishSite(fileURLToPath(root), dest);
    const english = fs.readFileSync(path.join(dest, 'index.html'), 'utf8');
    assert.match(english, /<title>Siyadao — Ideas, as they happen<\/title>/);
    assert.match(fs.readFileSync(path.join(dest, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/siyadao\.github\.io\/sitemap\.xml/);
    assert.ok(fs.existsSync(path.join(dest, 'styles.css')));
    assert.ok(fs.existsSync(path.join(dest, '.nojekyll')));
    assert.equal(fs.existsSync(path.join(dest, 'public/releases')), false);
  } finally {
    fs.rmSync(dest, { recursive: true, force: true });
  }
});
