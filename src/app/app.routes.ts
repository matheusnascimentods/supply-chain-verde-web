
import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/index.guard';
import { AppShellComponent } from './shared/components/app-shell/index.component';

export const routes: Routes = [
  {
    path: 'rastreio/:batchId',
    title: 'Rastreio',
    loadComponent: () =>
      import('./features/traceability').then((module) => module.TraceabilityComponent),
  },
  {
    path: 'login',
    title: 'Login',
    loadComponent: () => import('./features/auth/login').then((module) => module.LoginComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: '',
    canActivate: [authGuard],
    component: AppShellComponent,
    children: [
      {
        path: 'dashboard',
        title: 'Supply Chain | Dashboard',
        loadComponent: () =>
          import('./features/dashboard').then((module) => module.DashboardComponent),
      },
      {
        path: 'suppliers/me',
        canActivate: [roleGuard],
        data: { roles: ['supplier'] },
        loadComponent: () =>
          import('./features/suppliers/form/index.component').then(
            (module) => module.SupplierFormComponent,
          ),
      },
      {
        path: 'suppliers',
        title: 'Supply Chain | Fornecedores',
        loadChildren: () => import('./features/suppliers/routes').then((module) => module.routes),
      },
      {
        path: 'batches',
        title: 'Supply Chain | Lotes',
        loadChildren: () => import('./features/batches/routes').then((module) => module.routes),
      },
      {
        path: 'batches/:batchId/stages',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager', 'supplier'] },
        loadChildren: () => import('./features/chain/routes').then((module) => module.routes),
      },
      {
        path: 'users',
        title: 'Supply Chain | Usuários',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/users/routes').then((module) => module.routes),
      },
      {
        path: 'audit-log',
        title: 'Supply Chain | Autidoria',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'auditor'] },
        loadComponent: () =>
          import('./features/audit-log/index.component').then((module) => module.AuditLogComponent),
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];
