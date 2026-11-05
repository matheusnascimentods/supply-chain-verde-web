
import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/guards/index.guard';
import { AppShellComponent } from './core/layout/app-shell/index.component';

export const routes: Routes = [
  {
    path: 'rastreio/:batchId',
    loadChildren: () => import('./features/traceability').then((module) => module.routes),
  },
  {
    path: 'login',
    loadChildren: () => import('./features/auth').then((module) => module.routes),
  },
  {
    path: 'planos',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/signup').then((module) => module.routes),
  },
  {
    path: 'cadastro',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/signup').then((module) => module.signUpRoutes),
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/landing').then((module) => module.routes),
  },
  {
    path: '',
    canActivate: [authGuard],
    component: AppShellComponent,
    children: [
      {
        path: 'dashboard',
        title: 'Supply Chain | Dashboard',
        loadChildren: () => import('./features/dashboard').then((module) => module.routes),
      },
      {
        path: 'suppliers',
        title: 'Supply Chain | Fornecedores',
        canActivate: [roleGuard],
        data: { companyTypes: ['market'] },
        loadChildren: () => import('./features/suppliers').then((module) => module.routes),
      },
      {
        path: 'profile',
        title: 'Supply Chain | Meu perfil',
        loadChildren: () => import('./features/profile').then((module) => module.routes),
      },
      {
        path: 'batches',
        title: 'Supply Chain | Lotes',
        loadChildren: () => import('./features/batches').then((module) => module.routes),
      },
      {
        path: 'products',
        title: 'Supply Chain | Produtos',
        // RF-16: só a companhia fornecedora (admin e supplier) cadastra produtos.
        canActivate: [roleGuard],
        data: { roles: ['admin', 'supplier'], companyTypes: ['supplier'] },
        loadChildren: () => import('./features/products').then((module) => module.routes),
      },
      {
        path: 'users',
        title: 'Supply Chain | Usuários',
        loadChildren: () => import('./features/users').then((module) => module.routes),
      },
      {
        path: 'audit-log',
        title: 'Supply Chain | Autidoria',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'auditor', 'platform_admin'] },
        loadChildren: () => import('./features/audit-log').then((module) => module.routes),
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];
