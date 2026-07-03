const state = { data: null };

const headingPatterns = [
  /взносы/i,
  /почему инициативный сосед/i,
  /история вопроса/i,
  /как создавался шлагбаум/i,
  /почему сбором денег/i,
  /что происходит сейчас/i,
  /моя позиция/i,
  /для связи/i,
  /сегодня .*собрани/i,
  /повестка собрания/i,
  /о передаче полномочий/i,
  /о прекращении/i,
  /почему .*не кандидат/i,
  /что произошло/i,
  /почему это не отчет/i,
  /факт \d/i,
  /итог/i,
  /про сбор средств/i,
  /первопричина/i,
  /резюме по такси/i,
  /по такси/i,
  /важно! защита/i,
  /как мы работаем/i
];

const majorPatterns = [
  /взносы/i,
  /почему инициативный сосед/i,
  /история вопроса/i,
  /сегодня .*собрани/i,
  /о передаче полномочий/i,
  /о прекращении/i,
  /что произошло/i,
  /резюме по такси/i,
  /важно! защита/i
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function slugify(value, index) {
  return `section-${index}-${String(value).toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-|-$/g, '')}`;
}

function splitSections(lines) {
  const clean = lines.map((text, index) => ({ text: String(text || '').trim(), originalIndex: index + 1 })).filter(item => item.text);
  const sections = [];
  let current = { title: clean[0]?.text || 'Материалы', lines: [] };

  clean.forEach((item, i) => {
    const isHeading = headingPatterns.some(rx => rx.test(item.text));
    const isMajor = majorPatterns.some(rx => rx.test(item.text));
    const startsNew = i === 0 || (isHeading && (isMajor || current.lines.length > 8));
    if (startsNew && current.lines.length) {
      sections.push(current);
      current = { title: item.text, lines: [] };
    }
    current.lines.push(item);
  });
  if (current.lines.length) sections.push(current);
  return sections;
}

function renderSections(sections) {
  const stack = document.getElementById('contentSections');
  const nav = document.getElementById('sectionNav');
  stack.innerHTML = '';
  nav.innerHTML = '';
  sections.forEach((section, index) => {
    const id = slugify(section.title, index + 1);
    const link = document.createElement('a');
    link.href = `#${id}`;
    link.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span> ${escapeHtml(section.title)}`;
    nav.appendChild(link);

    const article = document.createElement('article');
    article.id = id;
    article.className = 'section-card reveal';
    article.dataset.index = String(index + 1).padStart(2, '0');
    const rows = section.lines.map(line => `
      <div class="line-row">
        <span class="line-no">L${line.originalIndex}</span>
        <div class="line-text">${escapeHtml(line.text)}</div>
      </div>`).join('');
    article.innerHTML = `<h3>${escapeHtml(section.title)}</h3><div class="line-list">${rows}</div>`;
    stack.appendChild(article);
  });
}

function renderMedia(data) {
  const grid = document.getElementById('mediaGrid');
  const images = (data.images || []).filter(Boolean);
  const links = (data.links || []).filter(Boolean);
  const cards = [];
  images.forEach((src, i) => {
    cards.push(`<article class="media-card"><img src="${escapeHtml(src)}" alt="Материал ${i + 1}" loading="lazy"></article>`);
  });
  links.forEach((href, i) => {
    cards.push(`<article class="media-card"><a href="${escapeHtml(href)}" target="_blank" rel="noopener">Внешняя ссылка ${i + 1}<br>${escapeHtml(href)}</a></article>`);
  });
  grid.innerHTML = cards.length ? cards.join('') : '<article class="media-card"><p>Внешние материалы не найдены в сохранённом снимке.</p></article>';
}

function hydrate(data) {
  state.data = data;
  const lines = Array.isArray(data.lines) ? data.lines : [];
  const sections = splitSections(lines);
  document.getElementById('siteTitle').textContent = lines[0] || 'kirill.su redesign';
  document.getElementById('snapshotMeta').textContent = data.generatedAt ? `Снимок создан: ${new Date(data.generatedAt).toLocaleString('ru-RU')}` : 'Снимок создан при сборке сайта.';
  document.getElementById('lineCount').textContent = String(lines.filter(Boolean).length);
  document.getElementById('sectionCount').textContent = String(sections.length);
  document.getElementById('mediaCount').textContent = String((data.images || []).length + (data.links || []).length);
  document.getElementById('rawText').textContent = lines.join('\n');
  renderSections(sections);
  renderMedia(data);
  revealNow();
}

function hydrateFallback() {
  const msg = 'Контент не найден. Запустите сборку GitHub Pages или выполните npm run build, чтобы создать dist/content.json.';
  document.getElementById('siteTitle').textContent = 'Нужна сборка контента';
  document.getElementById('snapshotMeta').textContent = msg;
  document.getElementById('rawText').textContent = msg;
}

async function loadData() {
  try {
    const res = await fetch('content.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`content.json ${res.status}`);
    hydrate(await res.json());
  } catch (error) {
    console.warn(error);
    hydrateFallback();
  }
}

function revealNow() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

function wireUi() {
  const progress = document.getElementById('progressBar');
  const glow = document.querySelector('.cursor-glow');
  window.addEventListener('scroll', () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const pct = height > 0 ? (window.scrollY / height) * 100 : 0;
    progress.style.width = `${pct}%`;
  }, { passive: true });
  window.addEventListener('pointermove', event => {
    if (!glow) return;
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  }, { passive: true });
  document.getElementById('copySource')?.addEventListener('click', async () => {
    const text = document.getElementById('rawText').textContent || '';
    await navigator.clipboard.writeText(text);
    document.getElementById('copySource').textContent = 'Скопировано';
    setTimeout(() => document.getElementById('copySource').textContent = 'Скопировать текст', 1400);
  });
  revealNow();
}

wireUi();
loadData();
