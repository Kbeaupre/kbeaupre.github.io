// Renders the project grid (index.html) and a single case study (project.html) from PROJECTS.

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null) continue;
    node.append(c instanceof Node ? c : document.createTextNode(c));
  }
  return node;
}

// Drafts stay out of the site; demo links stay out until they have a URL.
const VISIBLE = PROJECTS.filter(p => !p.hidden).map(p => {
  const links = (p.links || []).filter(l => l.href);
  return { ...p, links, demo: p.demo && links.length > 0 };
});

const CATEGORY_LABEL ={ work: 'Work', personal: 'Personal' };

function thumb(p) {
  return p.thumb
    ? el('img', { class: 'thumb', src: p.thumb, alt: '', loading: 'lazy' })
    : el('div', { class: 'thumb placeholder', 'aria-hidden': 'true' }, p.emoji || '◆');
}

function card(p) {
  return el('a', { class: 'card', href: `project.html?id=${encodeURIComponent(p.id)}`, 'data-category': p.category },
    thumb(p),
    el('div', { class: 'body' },
      el('h3', {}, p.title),
      el('p', {}, p.summary),
      el('div', { class: 'chips' },
        el('span', { class: 'chip' }, CATEGORY_LABEL[p.category]),
        p.parent ? el('span', { class: 'chip' }, 'OpsFlow module') : null,
        p.demo ? el('span', { class: 'chip' }, 'Live demo') : null,
        p.stack.slice(0, 3).map(s => el('span', { class: 'chip muted' }, s)),
      ),
    ),
  );
}

function renderIndex() {
  const grid = document.getElementById('grid');
  VISIBLE.forEach(p => grid.append(card(p)));

  const buttons = document.querySelectorAll('.filters button');
  buttons.forEach(btn => btn.addEventListener('click', () => {
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    const f = btn.dataset.filter;
    grid.querySelectorAll('.card').forEach(c => {
      c.hidden = f !== 'all' && c.dataset.category !== f;
    });
  }));
}

function section(title, content) {
  return [el('h2', {}, title), content];
}

function sectionItem(it) {
  const text = typeof it === 'string' ? it : it.text;
  const mod = typeof it === 'string' ? null : VISIBLE.find(x => x.id === it.module);
  return el('li', {}, text, mod ? [' ', el('a', { class: 'module-link', href: `project.html?id=${encodeURIComponent(mod.id)}` }, 'Read the case study →')] : null);
}

function renderProject() {
  const id = new URLSearchParams(location.search).get('id');
  const i = VISIBLE.findIndex(p => p.id === id);
  const root = document.getElementById('project');
  if (i < 0) { location.replace('./'); return; }
  const p = VISIBLE[i];
  document.title = `${p.title} · Kit Beaupré`;

  const links = p.links.map((l, n) =>
    el('a', { class: n === 0 ? 'btn primary' : 'btn', href: l.href, target: '_blank', rel: 'noopener' }, l.label));

  root.append(
    p.parent
      ? el('a', { class: 'back', href: `project.html?id=${encodeURIComponent(p.parent)}` }, `← ${(VISIBLE.find(x => x.id === p.parent) || {}).title || 'All projects'}`)
      : el('a', { class: 'back', href: './' }, '← All projects'),
    el('header', { class: 'p-head' },
      el('div', { class: 'kicker' }, p.kicker),
      el('h1', {}, p.title),
      el('p', { class: 'lede' }, p.lede),
      links.length ? el('div', { class: 'links' }, links) : null,
    ),
    el('dl', { class: 'facts' }, p.facts.map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v)))),
    el('div', { class: 'p-body' },
      section('The problem', el('p', {}, p.problem)),
      p.sections
        ? p.sections.map(sec => section(sec.title, el('ul', {}, sec.items.map(sectionItem))))
        : [section('What I built', el('ul', {}, p.built.map(b => el('li', {}, b)))),
           section('Highlights', el('ul', {}, p.highlights.map(h => el('li', {}, h))))],
      section('Stack', el('div', { class: 'chips' }, p.stack.map(s => el('span', { class: 'chip muted' }, s)))),
      p.note ? el('p', { class: 'note' }, p.note) : null,
    ),
    p.shots && p.shots.length
      ? el('div', { class: 'shots' }, el('h2', {}, 'Screenshots'),
          p.shots.map(s => { const img = el('img', { src: s.src, alt: s.caption, loading: 'lazy' }); const fig = el('figure', {}, img, el('figcaption', {}, s.caption)); const tag = () => fig.classList.toggle('portrait', img.naturalHeight > img.naturalWidth * 1.2); img.complete ? tag() : img.addEventListener('load', tag); return fig; }))
      : null,
  );

  const prev = VISIBLE[(i - 1 + VISIBLE.length) % VISIBLE.length];
  const next = VISIBLE[(i + 1) % VISIBLE.length];
  root.append(el('nav', { class: 'next' },
    el('a', { href: `project.html?id=${encodeURIComponent(prev.id)}` }, `← ${prev.title}`),
    el('a', { href: `project.html?id=${encodeURIComponent(next.id)}` }, `${next.title} →`)));
}

if (PROFILE.linkedin) Object.assign(document.getElementById('li-link'), { href: PROFILE.linkedin, hidden: false });
if (document.getElementById('grid')) {
  document.getElementById('headline').textContent = PROFILE.headline;
  document.getElementById('bio').textContent = PROFILE.bio;
  renderIndex();
} else {
  renderProject();
}
document.getElementById('year').textContent = new Date().getFullYear();
