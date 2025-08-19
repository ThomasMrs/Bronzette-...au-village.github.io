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
    row.className = 'hour-row' + (isToday(h.day) ? ' today' : '');
    row.setAttribute('aria-current', isToday(h.day) ? 'date' : '');

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

  btn.addEventListener('click', () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', String(!expanded));
    btn.setAttribute('aria-expanded', String(!expanded));
  });

  // Fermer le menu après clic sur un lien
  nav.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a && a.getAttribute('data-scroll') != null) {
      nav.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-expanded', 'false');
    }
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

    // focus accessible
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });

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
