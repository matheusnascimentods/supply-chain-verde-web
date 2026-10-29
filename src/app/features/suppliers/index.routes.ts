import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./presentation/pages/list/index.component').then((m) => m.SupplierListComponent) },
  { path: 'ranking', pathMatch: 'full', redirectTo: '' },
  { path: 'me', pathMatch: 'full', redirectTo: '/profile' },
];
