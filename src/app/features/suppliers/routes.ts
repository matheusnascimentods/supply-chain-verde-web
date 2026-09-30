import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/index.guard';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./list/index.component').then((m) => m.SupplierListComponent) },
  { path: 'ranking', pathMatch: 'full', redirectTo: '' },
  { path: 'new', canActivate: [roleGuard], data: { roles: ['admin', 'manager'] }, loadComponent: () => import('./form/index.component').then((m) => m.SupplierFormComponent) },
  { path: ':id/edit', canActivate: [roleGuard], data: { roles: ['admin', 'manager'] }, loadComponent: () => import('./form/index.component').then((m) => m.SupplierFormComponent) },
];
