import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./presentation/pages/list/index.component').then((m) => m.BatchListComponent) },
];
