import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/index.guard';

const loadForm = () => import('./presentation/pages/form/index.component').then((m) => m.SupplierFormComponent);

export const routes: Routes = [
  { path: '', loadComponent: () => import('./presentation/pages/list/index.component').then((m) => m.SupplierListComponent) },
  { path: 'ranking', pathMatch: 'full', redirectTo: '' },
  { path: 'new', pathMatch: 'full', redirectTo: '' },
  { path: 'me', canActivate: [roleGuard], data: { roles: ['supplier'] }, loadComponent: loadForm },
  { path: ':id/edit', canActivate: [roleGuard], data: { roles: ['admin', 'manager'] }, loadComponent: loadForm },
];
