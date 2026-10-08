import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./presentation/pages/audit-log/index.component').then((m) => m.AuditLogComponent) },
];
