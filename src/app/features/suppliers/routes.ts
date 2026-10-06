import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/index.guard';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./list/index.component').then((m) => m.SupplierListComponent) },
  { path: 'ranking', pathMatch: 'full', redirectTo: '' },
  { path: 'new', pathMatch: 'full', redirectTo: '' },
  { path: ':id/edit', canActivate: [roleGuard], data: { roles: ['admin', 'manager'] }, loadComponent: () => import('./form/index.component').then((m) => m.SupplierFormComponent) },
];
