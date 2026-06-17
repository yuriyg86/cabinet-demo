import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'categories',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/categories/categories-list/categories-list.component').then(
            (m) => m.CategoriesListComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/categories/category-form/category-form.component').then(
            (m) => m.CategoryFormComponent,
          ),
      },
    ],
  },
  {
    path: '',
    redirectTo: 'categories',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'categories',
  },
];
