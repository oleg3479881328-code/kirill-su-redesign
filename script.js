const SECTION_CONFIG = [
  {
    id: 'payments',
    nav: 'Взносы',
    title: 'Взносы и ремонт',
    lead: 'Сбор на обслуживание, текущие платежи и позиция по общему имуществу.',
    imageIndex: 0,
    start: /взносы: нет 18 долей/i,
    end: /почему инициативный сосед/i
  },
  {
    id: 'history',
    nav: 'История',
    title: 'История шлагбаума',
    lead: 'Как проект создавался, кто им занимался и почему спор вокруг него стал центральным вопросом.',
    imageIndex: 1,
    start: /почему инициативный сосед/i,
    end: /моя позиция/i
  },
  {
    id: 'position',
    nav: 'Позиция',
    title: 'Позиция Кирилла',
    lead: 'Запрос на сквозную отчётность, законность решений и необходимость нейтрального кандидата.',
    imageIndex: 2,
    start: /моя позиция/i,
    end: /сегодня 26 апреля 2026 инициирую собрание/i
  },
  {
    id: 'meeting',
    nav: 'Собрание',
    title: 'Собрание собственников',
    lead: 'Повестка, правовые основания и решение, которое предлагается вынести на голосование.',
    imageIndex: 3,
    start: /сегодня 26 апреля 2026 инициирую собрание/i,
    end: /о передаче полномочий уполномоченного лица/i
  },
  {
    id: 'handoff',
    nav: 'Передача',
    title: 'Передача полномочий',
    lead: 'Почему Кирилл предлагает завершить текущий цикл и передать ответственность новому нейтральному кандидату.',
    start: /о передаче полномочий уполномоченного лица/i,
    end: /что произошло 23 апреля 2026/i
  },
  {
    id: 'finance',
    nav: 'Финансы',
    title: 'Отчётность и финансы',
    lead: 'Почему представленный файл назван черновиком, а не полноценным финансовым отчётом.',
    start: /что произошло 23 апреля 2026/i,
    end: /резюме по такси/i
  },
  {
    id: 'taxi',
    nav: 'Такси',
    title: 'Такси и доступ',
    lead: 'Как трактуется нарушение регламента и почему вопрос возврата взноса стал отдельным конфликтом.',
    start: /резюме по такси/i,
    end: /важно! защита персональных данных/i
  },
  {
    id: 'privacy',
    nav: 'Данные',
    title: 'Персональные данные',
    lead: 'Публикация номеров, фамилий и квартир в чатах рассматривается как нарушение закона.',
    start: /важно! защита персональных данных/i,
    end: null
  }
];

const HIDDEN_LINES = [
  /^close$/i,
  /^ваш email$/i,
  /^послать сообщение$/i,
  /^нажимая на кнопку/i,
  /^made on tilda$/i,
  /^made on$/i,
  /^tilda$/i
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cleanLines(lines) {
  return (lines || [])
    .map(line => String(line || '').trim())
    .filter(line => line && !HIDDEN_LINES.some(rx => rx.test(line)));
}

function findIndex(lines, pattern, from = 0) {
  return lines.findIndex((line, index) => index >= from && pattern.test(line));
}

function getSlice(lines, config) {
  const start = findIndex(lines, config.start);
  if (start === -1) return [];
  const end = config.end ? findIndex(lines, config.end, start + 1) : -1;
  const slice = end === -1 ? lines.slice(start) : lines.slice(start, end);
  return cleanLines(slice);
}

function normalizeSectionLines(lines, title) {
  return lines.filter(line => line !== title);
}

function createParagraphs(lines, limit = 6) {
  const result = [];
  for (const line of lines) {
    if (result.length >= limit) break;
    if (/^(дата платежа|сумма операции)$/i.test(line)) continue;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(line)) continue;
    if (/^\d[\d\s]*,\d{2}$/.test(line)) continue;
    if (/^(повестка собрания|правовые основания|что это значит:|вывод:|итог)$/i.test(line)) continue;
    result.push(line);
  }
  return result;
}

function createBulletLines(lines, limit = 6) {
  const result = [];
  for (const line of lines) {
    if (result.length >= limit) break;
    if (/^[-*]/.test(line) || /^\d+\./.test(line) || /\?$/.test(line)) {
      const cleaned = line.replace(/^[-*\d.\s]+/, '').trim();
      if (cleaned) result.push(cleaned);
    }
  }
  return result;
}

function extractHeroLead(lines) {
  return (
    lines.find(line => /этот сайт создан, чтобы уйти от мессенджерной анархии/i.test(line)) ||
    lines.find(line => /содержание общего имущества это личная обязанность/i.test(line)) ||
    'Информация о шлагбауме, собрании собственников, отчётности и правилах доступа.'
  );
}

function extractHeroQuote(lines) {
  const quote = lines.find(line => /только собственники, только по делу, только по закону/i.test(line));
  return quote ? `«${quote}»` : '';
}

function extractFacts(allLines) {
  const facts = [];
  const debtLine = allLines.find(line => /18 долей/i.test(line));
  const collectedLine = allLines.find(line => /^1 485,00$/.test(line));
  const meetingLine = allLines.find(line => /26 апреля 2026/i.test(line));
  const privacyLine = allLines.find(line => /152-фз/i.test(line));

  if (debtLine) facts.push({ label: 'Ремонт', value: debtLine });
  if (collectedLine) facts.push({ label: 'Собрано', value: `${collectedLine} руб.` });
  if (meetingLine) facts.push({ label: 'Собрание', value: '26 апреля 2026' });
  if (privacyLine) facts.push({ label: 'Правила', value: '152-ФЗ о персональных данных' });

  return facts.slice(0, 4);
}

function renderFactRibbon(facts) {
  const root = document.getElementById('factRibbon');
  root.innerHTML = facts.map(fact => `
    <article class="fact-card">
      <span>${escapeHtml(fact.label)}</span>
      <strong>${escapeHtml(fact.value)}</strong>
    </article>
  `).join('');
}

function renderNav(configs) {
  const headerNav = document.getElementById('mainNav');
  const sectionNav = document.getElementById('sectionNav');
  const links = configs.map(item => `<a href="#${item.id}">${escapeHtml(item.nav)}</a>`).join('');
  headerNav.innerHTML = links;
  sectionNav.innerHTML = links;
}

function renderSections(configs, allLines, data) {
  const root = document.getElementById('contentSections');
  root.innerHTML = configs.map((config, index) => {
    const raw = normalizeSectionLines(getSlice(allLines, config), config.title);
    const paragraphs = createParagraphs(raw, config.id === 'finance' ? 7 : 5);
    const bullets = createBulletLines(raw, config.id === 'privacy' ? 5 : 6);
    const image = data.images?.[config.imageIndex] || '';
    const asideQuote = paragraphs.find(line => line.length > 90) || paragraphs[0] || '';
    const factCards = config.id === 'finance'
      ? raw.filter(line => /^факт \d/i.test(line)).slice(0, 5).map(line => `<li>${escapeHtml(line)}</li>`).join('')
      : '';

    return `
      <section id="${config.id}" class="story-block ${index % 2 ? 'reverse' : ''}">
        <div class="story-heading">
          <span class="story-index">${String(index + 1).padStart(2, '0')}</span>
          <h2>${escapeHtml(config.title)}</h2>
          <p class="story-lead">${escapeHtml(config.lead)}</p>
        </div>
        <div class="story-body">
          ${paragraphs.map(line => `<p>${escapeHtml(line)}</p>`).join('')}
          ${bullets.length ? `<ul>${bullets.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : ''}
          ${factCards ? `<div class="fact-list"><h3>Ключевые замечания</h3><ul>${factCards}</ul></div>` : ''}
        </div>
        <aside class="story-aside ${image ? 'has-image' : 'quote-card'}">
          ${image
            ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(config.title)}" loading="lazy">`
            : `<blockquote>${escapeHtml(asideQuote)}</blockquote>`}
        </aside>
      </section>
    `;
  }).join('');
}

function hydrate(data) {
  const lines = cleanLines(data.lines);
  document.title = data.pageTitle ? `${data.pageTitle} — современный редизайн` : document.title;
  document.getElementById('siteTitle').textContent = data.pageTitle || 'kirill.su';
  document.getElementById('heroLead').textContent = extractHeroLead(lines);
  document.getElementById('heroQuote').textContent = extractHeroQuote(lines);
  document.getElementById('heroImage').src = data.heroImage || data.images?.[0] || '';
  document.getElementById('regulationLink').href = data.links?.[0] || data.sourceUrl || '#';
  document.getElementById('contactSource').href = data.sourceUrl || '#';
  document.getElementById('contactDocs').href = data.links?.[0] || data.sourceUrl || '#';

  renderNav(SECTION_CONFIG);
  renderFactRibbon(extractFacts(lines));
  renderSections(SECTION_CONFIG, lines, data);
}

function hydrateFallback() {
  document.getElementById('siteTitle').textContent = 'Нужна сборка контента';
  document.getElementById('heroLead').textContent = 'Запустите сборку GitHub Pages или выполните node build.js, чтобы создать content.json.';
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

loadData();
