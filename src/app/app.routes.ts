
import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/index.guard';

export const routes: Routes = [
  {
    path: 'rastreio/:batchId',
    title: "Rastreio",
    loadComponent: () => import('./features/traceability').then((module) => module.TraceabilityComponent),
  },
  {
    path: 'login',
    title: "Login",
    loadComponent: () => import('./features/auth/login').then((module) => module.LoginComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        title: "Dashboard",
        loadComponent: () => import('./features/dashboard').then((module) => module.DashboardComponent),
      },
      {
        path: 'suppliers/ranking',
        loadComponent: () =>
          import('./features/suppliers/ranking/index.component').then(
            (module) => module.SupplierRankingComponent,
          ),
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
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager'] },
        loadChildren: () => import('./features/suppliers/routes').then((module) => module.routes),
      },
      {
        path: 'products',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager'] },
        loadChildren: () => import('./features/products/routes').then((module) => module.routes),
      },
      {
        path: 'certifications',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'auditor', 'supplier'] },
        loadChildren: () => import('./features/certifications/routes').then((module) => module.routes),
      },
      {
        path: 'batches',
        loadChildren: () => import('./features/batches/routes').then((module) => module.routes),
      },
      {
        path: 'batches/:batchId/stages',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager', 'supplier'] },
        loadChildren: () => import('./features/chain/routes').then((module) => module.routes),
      },
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager', 'auditor', 'supplier'] },
        loadChildren: () => import('./features/reports/routes').then((module) => module.routes),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/users/routes').then((module) => module.routes),
      },
      {
        path: 'audit-log',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'auditor'] },
        loadComponent: () =>
          import('./features/audit-log/index.component').then((module) => module.AuditLogComponent),
      },
      {
        path: '**',
        redirectTo: 'dashboard'
      },
    ],
  },
];
