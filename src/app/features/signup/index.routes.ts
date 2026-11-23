import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Supply Chain Verde | Assinatura',
    loadComponent: () => import('./presentation/pages/subscription/index.component').then((m) => m.SubscriptionComponent),
  },
];

export const signUpRoutes: Routes = [
  {
    path: '',
    title: 'Supply Chain Verde | Cadastro',
    loadComponent: () => import('./presentation/pages/sign-up/index.component').then((m) => m.SignUpComponent),
  },
];
