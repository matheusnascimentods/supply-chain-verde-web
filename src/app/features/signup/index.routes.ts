import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Supply Chain Verde | Planos',
    loadComponent: () => import('./presentation/pages/plans/index.component').then((m) => m.PlansComponent),
  },
];

export const signUpRoutes: Routes = [
  {
    path: '',
    title: 'Supply Chain Verde | Cadastro',
    loadComponent: () => import('./presentation/pages/sign-up/index.component').then((m) => m.SignUpComponent),
  },
];
