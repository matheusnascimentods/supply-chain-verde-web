import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Rastreio',
    loadComponent: () => import('./presentation/pages/traceability/index.component').then((m) => m.TraceabilityComponent),
  },
];
