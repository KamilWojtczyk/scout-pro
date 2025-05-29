import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (x) => x.DashboardComponent
          ),
      },
      {
        path: 'player/:name',
        loadComponent: () =>
          import('./features/player/player-details.component').then(
            (m) => m.PlayerDetailComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
