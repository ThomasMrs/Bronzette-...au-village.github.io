import { Routes } from '@angular/router';
import { BronzettePageComponent } from './pages/bronzette.page';

export const routes: Routes = [
  { path: '', component: BronzettePageComponent },
  { path: '**', redirectTo: '' }
];
