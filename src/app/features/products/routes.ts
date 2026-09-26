import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./list/index.component').then((m) => m.ProductListComponent) },
  { path: 'new', loadComponent: () => import('./form/index.component').then((m) => m.ProductFormComponent) },
  { path: ':id/edit', loadComponent: () => import('./form/index.component').then((m) => m.ProductFormComponent) },
];
