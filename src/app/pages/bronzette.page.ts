import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-bronzette',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bronzette.page.html',
  styleUrl: './bronzette.page.scss'
})
export class BronzettePageComponent {

// Ajoutez / complétez votre tableau d’horaires si besoin
hours = [
  { day: 'Lundi', value: 'Fermé' },
  { day: 'Mardi', open: '09:00', close: '21:00' },
  { day: 'Mercredi', open: '08:00', close: '21:00', note: '(jour de marché)' },
  { day: 'Jeudi', open: '09:00', close: '21:00' },
  { day: 'Vendredi', open: '09:00', close: '21:00' },
  { day: 'Samedi', open: '08:00', close: '21:00' },
  { day: 'Dimanche', open: '09:00', close: '12:00' }
];

scrollToSection(id: string, event?: Event) {
  event?.preventDefault();

  const el = document.getElementById(id);
  if (!el) return;

  // Hauteur de l’en-tête sticky (si vous voulez compenser quand l’élément est plus grand que le viewport)
  const header = document.querySelector('.site-header') as HTMLElement | null;
  const headerH = header?.offsetHeight ?? 0;

  const rect = el.getBoundingClientRect();
  const elemHeight = rect.height;
  const viewport = window.innerHeight;

  let targetTop = rect.top + window.scrollY;

  if (elemHeight < viewport) {
    // Centre exact dans la fenêtre
    targetTop = targetTop - (viewport - elemHeight) / 2;
  } else {
    // Si la section est plus grande que la fenêtre, on l’aligne sous le header
    targetTop = targetTop - headerH - 12;
  }

  window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });

  // Conserver le fragment dans l’URL (partage / rafraîchissement)
  history.replaceState(null, '', `#${id}`);

  // Accessibilité : déplacer le focus sur la section sans re-défilement
  el.setAttribute('tabindex', '-1');
  (el as HTMLElement).focus({ preventScroll: true });
}

// Clé du jour courant en français (timezone France)
todayKey = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  timeZone: 'Europe/Paris'
}).format(new Date()).toLowerCase();

// Méthode utilitaire pour la comparaison
isToday(day: string): boolean {
  return day.toLowerCase() === this.todayKey;
}

  private fb = inject(FormBuilder);

  year = new Date().getFullYear();
  menuOpen = signal(false);

  reservationForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', Validators.email],
    date: ['', Validators.required],
    time: ['', Validators.required],
    covers: [2, [Validators.required, Validators.min(1)]],
    message: ['']
  });

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  submit() {
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }
    // À brancher vers votre back-end / emailer.
    console.log('Réservation envoyée : ', this.reservationForm.value);
    alert('Merci ! Votre demande de réservation a été enregistrée.');
    this.reservationForm.reset({ covers: 2 });
  }
}
