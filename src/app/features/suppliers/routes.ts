import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./list/index.component').then((m) => m.SupplierListComponent) },
  { path: 'new', loadComponent: () => import('./form/index.component').then((m) => m.SupplierFormComponent) },
  { path: ':id/edit', loadComponent: () => import('./form/index.component').then((m) => m.SupplierFormComponent) },
  { path: 'ranking', loadComponent: () => import('./ranking/index.component').then((m) => m.SupplierRankingComponent) },
];
