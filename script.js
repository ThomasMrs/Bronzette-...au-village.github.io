/* ---------- Données horaires ---------- */
const HOURS = [
  { day: 'Lundi', value: 'Fermé' },
  { day: 'Mardi', open: '09:00', close: '21:00' },
  { day: 'Mercredi', open: '08:00', close: '21:00', note: '(jour de marché)' },
  { day: 'Jeudi', open: '09:00', close: '21:00' },
  { day: 'Vendredi', open: '09:00', close: '21:00' },
  { day: 'Samedi', open: '08:00', close: '21:00' },
  { day: 'Dimanche', open: '09:00', close: '12:00' }
];

/* ---------- Utilitaires ---------- */
function todayKey() {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    timeZone: 'Europe/Paris'
  }).format(new Date()).toLowerCase();
}
function isToday(label) {
  return label.toLowerCase() === todayKey();
}

/* ---------- Rendu des horaires ---------- */
(function renderHours(){
  const wrap = document.getElementById('hoursContainer');
  if (!wrap) return;
  wrap.innerHTML = '';
  HOURS.forEach(h => {
    const row = document.createElement('div');
    row.className = 'hour-row';

    if (isToday(h.day)) {
      row.classList.add('today');
      row.setAttribute('aria-current', 'date');
    }

    const left = document.createElement('span');
    left.textContent = h.day;

    const right = document.createElement('span');
    if ('value' in h) {
      right.textContent = h.value;
    } else {
      right.innerHTML = `${h.open} – ${h.close}${h.note ? ` <em>${h.note}</em>` : ''}`;
    }

    row.append(left, right);
    wrap.appendChild(row);
  });
})();

/* ---------- Menu mobile ---------- */
(function mobileMenu(){
  const nav = document.querySelector('.main-nav');
  const btn = document.getElementById('navToggle');
  if (!nav || !btn) return;

  const closeMenu = () => {
    nav.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-expanded', 'false');
  };
  const toggleMenu = () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', String(!expanded));
    btn.setAttribute('aria-expanded', String(!expanded));
  };

  btn.addEventListener('click', toggleMenu);

  // Fermer le menu après clic sur un lien
  nav.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a && a.getAttribute('data-scroll') != null) closeMenu();
  });

  // Échap pour fermer
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // Clic en dehors pour fermer
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && e.target !== btn) closeMenu();
  });
})();

/* ---------- Défilement centré / compensation header ---------- */
(function smoothScroll(){
  const header = document.querySelector('.site-header');
  const headerH = () => header?.offsetHeight ?? 0;

  function scrollToTarget(id){
    const el = document.getElementById(id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const elemHeight = rect.height;
    const viewport = window.innerHeight;

    let top = rect.top + window.scrollY;
    if (elemHeight < viewport) {
      top = top - (viewport - elemHeight) / 2;
    } else {
      top = top - headerH() - 12;
    }
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });

    // focus accessible (puis retrait du tabindex)
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
    setTimeout(() => el.removeAttribute('tabindex'), 0);

    history.replaceState(null, '', `#${id}`);
  }

  document.querySelectorAll('a[data-scroll]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        e.preventDefault();
        scrollToTarget(href.slice(1));
      }
    });
  });

  if (location.hash) {
    const id = location.hash.replace('#','');
    setTimeout(() => scrollToTarget(id), 50);
  }
})();

/* ---------- Année dynamique ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Lightbox / Modale ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const modal    = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const caption  = document.getElementById('caption');
  const closeBtn = document.querySelector('.modal-close');
  let lastFocus  = null;

  function getFocusable(node){
    return Array.from(
      node.querySelectorAll(
        'a, button, input, textarea, select, summary, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
  }

  function openLightbox(src, title, trigger) {
    lastFocus = trigger || document.activeElement;
    modalImg.src = src;
    modalImg.alt = title || '';
    caption.textContent = title || '';

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');

    closeBtn.focus();
  }
  function closeLightbox() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modalImg.removeAttribute('src');
    modalImg.removeAttribute('alt');
    document.body.classList.remove('no-scroll');
    lastFocus?.focus();
  }

  // Intercepte tout clic sur <a data-lightbox>
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-lightbox]');
    if (!link) return;
    e.preventDefault();
    const src = link.getAttribute('href');
    const title = link.closest('.card')?.querySelector('h4')?.textContent?.trim() || '';
    openLightbox(src, title, link);
  });

  // Fermetures
  closeBtn.addEventListener('click', closeLightbox);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();

    // Piège de focus (Tab) robuste
    if (e.key === 'Tab' && modal.classList.contains('open')) {
      const focusables = getFocusable(modal);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
});


/* ===== Cartes interactives (recherche robuste, sans impression) ===== */

// Détermine des URLs robustes, même si le site est servi depuis /<repo> sur GitHub Pages
const baseURL = new URL('.', location.href);
const DRINKS_JSON_URL = new URL('boissons.json', baseURL).href;
const FOOD_JSON_URL   = new URL('plats.json', baseURL).href;

async function fetchJSON(url){
  // no-cache pour éviter un ancien JSON en production (GitHub Pages)
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Échec de chargement: ${url} (${res.status})`);
  return res.json();
}

// Normalisation très tolérante (accents, ponctuation, espaces)
function normalize(str){
  return (str || '')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // accents
    .toLowerCase()
    .replace(/[^\w\s€%.-]/g, ' ')                       // ponctuation exotique
    .replace(/\s+/g, ' ')                               // espaces multiples
    .trim();
}

function euro(val){
  // accepte nombre ou chaîne
  const n = typeof val === 'number' ? val : Number(String(val).replace(',', '.'));
  if (Number.isFinite(n)) return `${n.toFixed(2).replace('.', ',')} €`;
  return ''; // prix optionnel
}

function renderMenu(listEl, items){
  listEl.innerHTML = '';
  const frag = document.createDocumentFragment();

  if (!items.length){
    const p = document.createElement('p');
    p.className = 'note';
    p.textContent = 'Aucun résultat pour cette recherche.';
    listEl.appendChild(p);
    return;
  }

  items.forEach(it => {
    const card = document.createElement('article');
    card.className = 'menu-item';
    if (it.category) card.dataset.category = it.category;

    const head = document.createElement('div');
    head.className = 'head';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = it.title || '';

    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = euro(it.price);

    head.append(title, price);

    const desc = document.createElement('p');
    desc.className = 'desc';
    if (it.desc) desc.textContent = it.desc;

    const tags = document.createElement('div');
    tags.className = 'tags';
    (it.tags || []).forEach(t => {
      const span = document.createElement('span');
      span.className = 'tag' + (t.toLowerCase().includes('saison') ? ' seasonal' : t.toLowerCase().includes('nouve') ? ' new' : '');
      span.textContent = t;
      tags.appendChild(span);
    });

    card.append(head);
    if (it.desc) card.append(desc);
    if ((it.tags || []).length) card.append(tags);
    frag.appendChild(card);
  });

  listEl.appendChild(frag);
}

function bindControls(scope, listEl, data){
  const search = document.getElementById(`search-${scope}`);
  const btns = Array.from(document.querySelectorAll(`[data-scope="${scope}"][data-filter]`));

  // Filtrage + recherche
  const apply = () => {
    const q = normalize(search.value);
    const active = btns.find(b => b.classList.contains('is-active'))?.dataset.filter || 'all';

    const filtered = data.filter(it => {
      const hay = normalize(`${it.title||''} ${it.desc||''} ${(it.tags||[]).join(' ')}`);
      const matchText = !q || hay.includes(q);
      const matchCat = active === 'all' || it.category === active;
      return matchText && matchCat;
    });

    renderMenu(listEl, filtered);
  };

  // Activation du bon filtre
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    apply();
  }));

  // Recherche : saisir / coller / effacer (icône "X" des champs search)
  ['input','change','search'].forEach(evt => {
    search.addEventListener(evt, apply);
  });

  apply();
}

(async function initInteractiveMenus(){
  const drinksList = document.getElementById('drinks-list');
  const foodList   = document.getElementById('food-list');
  if (!drinksList || !foodList) return;

  try{
    const [drinks, food] = await Promise.all([
      fetchJSON(DRINKS_JSON_URL),
      fetchJSON(FOOD_JSON_URL)
    ]);

    bindControls('drinks', drinksList, Array.isArray(drinks) ? drinks : []);
    bindControls('food',   foodList,   Array.isArray(food)   ? food   : []);
  }catch(e){
    console.error(e);
    drinksList.innerHTML = `<p class="note">Impossible de charger la carte des boissons. <a href="Boissons.jpg" target="_blank" rel="noopener">Voir l’image</a>.</p>`;
    foodList.innerHTML   = `<p class="note">Impossible de charger la carte des plats. <a href="Menu.jpg" target="_blank" rel="noopener">Voir l’image</a>.</p>`;
  }finally{
    drinksList.setAttribute('aria-live','polite');
    drinksList.setAttribute('aria-busy','false');
    foodList.setAttribute('aria-live','polite');
    foodList.setAttribute('aria-busy','false');
  }
})();

// Intercepte tout clic sur <a data-lightbox>
document.body.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-lightbox]');
  if (!link) return;
  e.preventDefault();

  const src = link.getAttribute('href');

  // 1) data-title sur le lien
  // 2) aria-label du lien
  // 3) .section-title de la section parente
  // 4) fallback: texte du lien
  const title =
    link.dataset.title ||
    link.getAttribute('aria-label') ||
    link.closest('section')?.querySelector('.section-title')?.textContent?.trim() ||
    link.textContent?.trim() ||
    '';

  openLightbox(src, title, link);
});
