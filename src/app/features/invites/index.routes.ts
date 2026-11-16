import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Supply Chain Verde | Convite',
    loadComponent: () => import('./presentation/pages/accept/index.component').then((m) => m.AcceptInviteComponent),
  },
];
