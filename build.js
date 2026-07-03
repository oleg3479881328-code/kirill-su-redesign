import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SOURCE_URL = process.env.SOURCE_URL || 'https://kirill.su/';
const OUT_DIR = 'dist';
const ORIGINAL_PATH = `${OUT_DIR}/original.html`;
const CONTENT_PATH = `${OUT_DIR}/content.json`;
const NOISE_LINES = new Set(['Made on', 'Tilda']);

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function extractPageTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeEntities(match?.[1] || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isUsefulImage(url) {
  if (!/^https?:\/\//i.test(url)) return false;
  if (/static\.tildacdn\.com\/img\/tildafavicon/i.test(url)) return false;
  if (/static\.tildacdn\.com\/img\/tildacopy/i.test(url)) return false;
  if (/lib\/icons\/tilda\//i.test(url)) return false;
  return true;
}

function extractImages(html) {
  const urls = new Set();
  const rx = /<(?:img|source)\b[^>]*(?:src|data-original|data-img-zoom-url|data-src)=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = rx.exec(html))) {
    const url = match[1];
    if (isUsefulImage(url)) urls.add(url);
  }
  return [...urls];
}

function extractHeroImage(html) {
  const coverMatch = html.match(/data-content-cover-bg=["']([^"']+)["']/i);
  if (coverMatch?.[1]) return coverMatch[1];

  const bgMatch = html.match(/background-image:url\(['"]?(https?:\/\/[^'")]+)['"]?\)/i);
  if (bgMatch?.[1]) return bgMatch[1];

  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogMatch?.[1]) return ogMatch[1];

  return extractImages(html)[0] || null;
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
    .filter(line => line && !NOISE_LINES.has(line) && !/^Made on Tilda$/i.test(line));

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

async function readPreviousSnapshot() {
  if (!existsSync(CONTENT_PATH) || !existsSync(ORIGINAL_PATH)) return null;
  try {
    const [contentRaw, originalHtml] = await Promise.all([
      readFile(CONTENT_PATH, 'utf8'),
      readFile(ORIGINAL_PATH, 'utf8')
    ]);
    return { content: JSON.parse(contentRaw), originalHtml };
  } catch {
    return null;
  }
}

async function writeSnapshot({ html, data }) {
  await writeFile(CONTENT_PATH, JSON.stringify(data, null, 2), 'utf8');
  await writeFile(ORIGINAL_PATH, html, 'utf8');
  await copyStatic();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  try {
    const response = await fetch(SOURCE_URL, {
      headers: { 'user-agent': 'kirill-su-redesign-snapshot/1.0' }
    });
    if (!response.ok) throw new Error(`Cannot fetch ${SOURCE_URL}: ${response.status}`);

    const html = await response.text();
    const lines = extractVisibleText(html);
    const data = {
      sourceUrl: SOURCE_URL,
      generatedAt: new Date().toISOString(),
      fetchOk: true,
      warnings: [],
      pageTitle: extractPageTitle(html) || lines[0] || 'kirill.su',
      heroImage: extractHeroImage(html),
      lines,
      images: extractImages(html),
      links: extractLinks(html)
    };

    await writeSnapshot({ html, data });
    console.log(`Saved ${lines.length} text lines, ${data.images.length} images, ${data.links.length} links from ${SOURCE_URL}`);
  } catch (error) {
    const previous = await readPreviousSnapshot();
    const warning = `Source fetch failed at build time: ${error.message}`;

    if (previous) {
      const data = {
        ...previous.content,
        generatedAt: new Date().toISOString(),
        fetchOk: false,
        warnings: [...new Set([...(previous.content.warnings || []), warning, 'Rendered from the last successful local snapshot.'])]
      };
      await writeSnapshot({ html: previous.originalHtml, data });
      console.warn(`Used previous snapshot fallback because ${error.message}`);
      return;
    }

    const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>kirill.su fallback</title></head><body><p>Source snapshot unavailable.</p></body></html>`;
    const data = {
      sourceUrl: SOURCE_URL,
      generatedAt: new Date().toISOString(),
      fetchOk: false,
      warnings: [warning, 'No previous snapshot was available, so a minimal fallback page was generated.'],
      pageTitle: 'kirill.su — источник временно недоступен',
      heroImage: null,
      lines: [
        'Источник временно недоступен.',
        'Автоматический снимок не удалось получить во время этой сборки.',
        'Проверьте доступность https://kirill.su/ и запустите сборку повторно.'
      ],
      images: [],
      links: [SOURCE_URL]
    };
    await writeSnapshot({ html, data });
    console.warn(`Created minimal fallback snapshot because ${error.message}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
