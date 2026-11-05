import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Supply Chain Verde | Planos',
    loadComponent: () => import('./presentation/pages/plans/index.component').then((m) => m.PlansComponent),
  },
];
