import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./presentation/pages/dashboard/index.component').then((m) => m.DashboardComponent) },
];
