import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/index.guard';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./list/index.component').then((m) => m.BatchListComponent) },
  { path: 'new', canActivate: [roleGuard], data: { roles: ['supplier'] }, loadComponent: () => import('./form/index.component').then((m) => m.BatchFormComponent) },
];
