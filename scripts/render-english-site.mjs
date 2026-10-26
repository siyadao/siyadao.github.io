import fs from 'node:fs';
import vm from 'node:vm';

export const chineseSite = 'https://studio.siyadao.cn/';
export const englishSite = 'https://siyadao.github.io/';

export function catalogFromSource(source) {
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
  return new Map(window.SiyadaoI18n.catalog);
}

function translateText(text, messages) {
  const key = text.trim();
  if (!messages.has(key)) return text;
  return text.replace(key, messages.get(key));
}

function translateAttrs(tag, messages) {
  return tag.replace(
    /(alt|aria-label|title|content|data-title|data-description)="([^"]*)"/g,
    (all, name, value) => (messages.has(value) ? `${name}="${messages.get(value)}"` : all),
  );
}

export function renderEnglishHtml(html, messages) {
  let i = 0;
  let out = '';
  const noI18n = [];
  while (i < html.length) {
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i);
      const j = end === -1 ? html.length : end + 3;
      out += html.slice(i, j);
      i = j;
      continue;
    }
    if (html[i] !== '<') {
      const next = html.indexOf('<', i);
      const j = next === -1 ? html.length : next;
      const text = html.slice(i, j);
      out += noI18n.length === 0 ? translateText(text, messages) : text;
      i = j;
      continue;
    }
    const end = html.indexOf('>', i);
    if (end === -1) {
      out += html.slice(i);
      break;
    }
    let tag = html.slice(i, end + 1);
    const nameMatch = /^<\s*\/?\s*([a-zA-Z0-9]+)/.exec(tag);
    const name = nameMatch ? nameMatch[1].toLowerCase() : '';
    const closing = /^<\s*\//.test(tag);
    if (closing) {
      if (noI18n.at(-1) === name) noI18n.pop();
      out += tag;
      i = end + 1;
      continue;
    }
    if (name === 'html') {
      tag = tag.replace('lang="zh-CN"', 'lang="en"');
      if (!tag.includes('data-lang=')) tag = tag.replace('<html', '<html data-lang="en"');
    }
    if (tag.includes('data-lang-toggle')) {
      tag = tag
        .replace(/href="[^"]*"/, `href="${chineseSite}"`)
        .replaceAll('Switch to English', '切换到中文');
    } else if (noI18n.length === 0) {
      tag = translateAttrs(tag, messages);
    }
    if (tag.includes('data-no-i18n')) noI18n.push(name);
    out += tag;
    i = end + 1;
    if (name === 'script' || name === 'style' || name === 'svg') {
      const closer = new RegExp(`</${name}\\s*>`, 'i');
      const rest = html.slice(i);
      const found = closer.exec(rest);
      if (!found) {
        out += rest;
        break;
      }
      out += rest.slice(0, found.index + found[0].length);
      i += found.index + found[0].length;
    }
  }
  out = out.replace(/(<a\b[^>]*data-lang-toggle[^>]*>)\s*EN\s*(<\/a>)/, '$1中文$2');
  out = out.replace(
    '<link rel="canonical" href="https://studio.siyadao.cn/" />',
    `<link rel="canonical" href="${englishSite}" />`,
  );
  out = out.replace(
    '<meta property="og:url" content="https://studio.siyadao.cn/" />',
    `<meta property="og:url" content="${englishSite}" />`,
  );
  out = out.replaceAll('https://studio.siyadao.cn/public/og.png', `${englishSite}public/og.png`);
  out = out.replace('"url": "https://studio.siyadao.cn/"', `"url": "${englishSite}"`);
  out = out.replace(
    '"downloadUrl": "https://studio.siyadao.cn/#downloads"',
    `"downloadUrl": "${englishSite}#downloads"`,
  );
  out = out.replace(
    '<meta property="og:locale" content="zh_CN" />',
    '<meta property="og:locale" content="en_US" />',
  );
  out = out.replace(
    '<meta property="og:locale:alternate" content="en_US" />',
    '<meta property="og:locale:alternate" content="zh_CN" />',
  );
  out = out.replace('"inLanguage": "zh-CN"', '"inLanguage": "en"');
  const descriptionKey = [...messages.keys()].find((key) => key.startsWith('思芽岛原生桌面工作台：'));
  if (descriptionKey) out = out.replaceAll(descriptionKey, messages.get(descriptionKey));
  return out;
}

export function englishRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${englishSite}sitemap.xml\n`;
}

function main() {
  const destination = process.argv[2];
  if (!destination) return;
  const root = new URL('../', import.meta.url);
  const html = fs.readFileSync(new URL('index.html', root), 'utf8');
  const source = fs.readFileSync(new URL('i18n.js', root), 'utf8');
  fs.mkdirSync(destination, { recursive: true });
  fs.writeFileSync(`${destination}/index.html`, renderEnglishHtml(html, catalogFromSource(source)));
  fs.writeFileSync(`${destination}/robots.txt`, englishRobots());
}

if (process.argv[1] && process.argv[1].endsWith('render-english-site.mjs') && process.argv[2]) main();
