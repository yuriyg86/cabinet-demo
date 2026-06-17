import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: 'categories',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/categories/categories-list/categories-list.component').then(
                (m) => m.CategoriesListComponent,
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/categories/category-form/category-form.component').then(
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
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
