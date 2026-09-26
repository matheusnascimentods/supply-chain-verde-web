import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./list/index.component').then((m) => m.BatchListComponent) },
  { path: 'new', loadComponent: () => import('./form/index.component').then((m) => m.BatchFormComponent) },
];
