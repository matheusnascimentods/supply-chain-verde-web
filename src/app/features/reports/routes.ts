import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./list/index.component').then((m) => m.ReportListComponent) },
  { path: 'new', loadComponent: () => import('./form/index.component').then((m) => m.ReportFormComponent) },
];
