/* ---------- Données horaires ---------- */
const HOURS = [
  { day: 'Lundi', value: 'Fermé' },
  { day: 'Mardi', open: '09:00', close: '21:00' },
  { day: 'Mercredi', open: '08:00', close: '21:00', note: '(jour de marché)' },
  { day: 'Jeudi', open: '09:00', close: '21:00' },
  { day: 'Vendredi', open: '09:00', close: '21:00' },
  { day: 'Samedi', open: '08:00', close: '21:00', note: '(jour de marché)' },
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
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

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

  // Si l’URL contient déjà un hash au chargement
  if (location.hash) {
    const id = location.hash.replace('#','');
    // petit délai pour laisser le layout se stabiliser
    setTimeout(() => scrollToTarget(id), 50);
  }
})();

/* ---------- Formulaire de réservation ---------- */
(function reservationForm(){
  const form = document.getElementById('reservationForm');
  if (!form) return;

  // Empêcher sélection d'une date passée
  const todayISO = new Date().toISOString().slice(0,10);
  form.elements['date']?.setAttribute('min', todayISO);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form).entries());
    console.log('Réservation envoyée :', data);
    alert('Merci ! Votre demande de réservation a été enregistrée.');
    form.reset();
    form.elements['covers'].value = '2';
  });
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

  function openLightbox(src, title, trigger) {
    lastFocus = trigger || document.activeElement;
    modalImg.src = src;
    modalImg.alt = title || '';
    caption.textContent = title || '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function closeLightbox() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modalImg.removeAttribute('src');
    modalImg.removeAttribute('alt');
    document.body.style.overflow = '';
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

    // Piège de focus minimal (Tab)
    if (e.key === 'Tab' && modal.classList.contains('open')) {
      const focusables = [closeBtn, modalImg];
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
});
