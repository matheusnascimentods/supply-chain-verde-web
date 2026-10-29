import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/pages/profile/index.component').then((m) => m.ProfileComponent),
  },
];
