import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Login',
    loadComponent: () => import('./presentation/pages/login/index.component').then((m) => m.LoginComponent),
  },
];
