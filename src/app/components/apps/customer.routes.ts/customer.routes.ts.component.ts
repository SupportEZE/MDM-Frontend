import { Routes } from '@angular/router';
import { authGuard } from '../../../core/auth/auth.guard';
import { CUSTOMER_CHILD_ROUTES } from '../customer-child.routes.ts/customer-child.routes.ts.component';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: 'customer-list',
    loadComponent: () =>
      import('../customer-list/customer-list.component').then(
        (m) => m.CustomerListComponent,
      ),
    title: 'Customer List',
    canActivate: [authGuard],
  },

  {
    path: 'customer-add',
    loadComponent: () =>
      import('../customer-add/customer-add.component').then(
        (m) => m.CustomerAddComponent,
      ),
    title: 'Customer Add',
    canActivate: [authGuard],
  },

  {
    path: 'customer-edit/:type/:id',
    loadComponent: () =>
      import('../customer-add/customer-add.component').then(
        (m) => m.CustomerAddComponent,
      ),
    title: 'Customer Edit',
    canActivate: [authGuard],
  },

  {
    path: 'customer-detail/:id',
    loadComponent: () =>
      import('../customer-detail/customer-detail.component').then(
        (m) => m.CustomerDetailComponent,
      ),
    title: 'Customer Detail',
    canActivate: [authGuard],
  },
];
