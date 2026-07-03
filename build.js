import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SOURCE_URL = process.env.SOURCE_URL || 'https://kirill.su/';
const OUT_DIR = 'dist';

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function extractImages(html) {
  const urls = new Set();
  const rx = /<(?:img|source)\b[^>]*(?:src|data-original|data-img-zoom-url|data-src)=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = rx.exec(html))) {
    const url = match[1];
    if (/^https?:\/\//i.test(url) && !/static\.tildacdn\.com\/img\/tildafavicon/i.test(url)) urls.add(url);
  }
  return [...urls];
}

function extractLinks(html) {
  const urls = new Set();
  const rx = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = rx.exec(html))) {
    const url = match[1];
    if (/^https?:\/\//i.test(url) && !/tilda\.cc/i.test(url)) urls.add(url);
  }
  return [...urls];
}

function extractVisibleText(html) {
  let text = html;
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  text = text.replace(/<br\s*\/?\s*>/gi, '\n');
  text = text.replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>|<\/tr>|<\/section>|<\/article>/gi, '\n');
  text = text.replace(/<[^>]+>/g, ' ');
  text = decodeEntities(text);
  const lines = text
    .split(/\n+/)
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .filter(line => line && !/^Made on Tilda$/i.test(line));

  const deduped = [];
  for (const line of lines) {
    const prev = deduped[deduped.length - 1];
    if (line !== prev) deduped.push(line);
  }
  return deduped;
}

async function copyStatic() {
  const files = ['index.html', 'styles.css', 'script.js', '.nojekyll'];
  for (const file of files) {
    if (existsSync(file)) await copyFile(file, `${OUT_DIR}/${file}`);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const response = await fetch(SOURCE_URL, {
    headers: { 'user-agent': 'kirill-su-redesign-snapshot/1.0' }
  });
  if (!response.ok) throw new Error(`Cannot fetch ${SOURCE_URL}: ${response.status}`);
  const html = await response.text();
  const lines = extractVisibleText(html);
  const data = {
    sourceUrl: SOURCE_URL,
    generatedAt: new Date().toISOString(),
    lines,
    images: extractImages(html),
    links: extractLinks(html)
  };
  await writeFile(`${OUT_DIR}/content.json`, JSON.stringify(data, null, 2), 'utf8');
  await writeFile(`${OUT_DIR}/original.html`, html, 'utf8');
  await copyStatic();
  console.log(`Saved ${lines.length} text lines, ${data.images.length} images, ${data.links.length} links from ${SOURCE_URL}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
