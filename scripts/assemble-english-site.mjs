import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogFromSource, englishRobots, renderEnglishHtml } from './render-english-site.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function readSiteFiles(rootDir) {
  const text = fs.readFileSync(path.join(rootDir, 'scripts/site-files.txt'), 'utf8');
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

export function assembleEnglishSite(rootDir, destination) {
  const dest = path.resolve(destination);
  if (fs.existsSync(path.join(dest, '.git'))) {
    throw new Error('refuse to write into a git checkout');
  }
  const files = readSiteFiles(rootDir);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const rel of files) {
    if (rel.startsWith('/') || rel.includes('..')) throw new Error(`refusing path ${rel}`);
    const from = path.join(rootDir, rel);
    const to = path.join(dest, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const source = fs.readFileSync(path.join(rootDir, 'i18n.js'), 'utf8');
  fs.writeFileSync(path.join(dest, 'index.html'), renderEnglishHtml(html, catalogFromSource(source)));
  fs.writeFileSync(path.join(dest, 'robots.txt'), englishRobots());
  fs.writeFileSync(path.join(dest, '.nojekyll'), '');
  fs.writeFileSync(
    path.join(dest, 'README.md'),
    '# Siyadao English site\n\nPublished from https://github.com/siyadao/website by GitHub Actions.\nThe Chinese site is https://studio.siyadao.cn/.\n',
  );
}

function main() {
  const destination = process.argv[2];
  if (!destination) return;
  assembleEnglishSite(root, destination);
}

if (process.argv[1] && process.argv[1].endsWith('assemble-english-site.mjs') && process.argv[2]) main();
