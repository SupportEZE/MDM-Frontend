import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from '../../../core/auth/auth.guard';

export const CUSTOMER_CHILD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../customer-list/customer-list.component').then(
        (m) => m.CustomerListComponent,
      ),
    title: 'Customer List',
    canActivate: [authGuard],
  },

  {
    path: 'add',
    loadComponent: () =>
      import('../customer-add/customer-add.component').then(
        (m) => m.CustomerAddComponent,
      ),
    title: 'Customer Add',
    canActivate: [authGuard],
  },

  {
    path: 'detail',
    loadComponent: () =>
      import('../customer-detail/customer-detail.component').then(
        (m) => m.CustomerDetailComponent,
      ),
    title: 'Customer Detail',
    canActivate: [authGuard],
  },
];
