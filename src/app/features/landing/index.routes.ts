import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Supply Chain Verde',
    loadComponent: () => import('./presentation/pages/landing/index.component').then((m) => m.LandingComponent),
  },
];
