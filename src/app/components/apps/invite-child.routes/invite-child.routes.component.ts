import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from '../../../core/auth/auth.guard';

export const INVITE_CHILD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../invite-list/invite-list.component').then(
        (m) => m.InviteListComponent,
      ),
    title: 'Invite List',
    canActivate: [authGuard],
  },

  {
    path: 'add',
    loadComponent: () =>
      import('../invite-add/invite-add.component').then(
        (m) => m.InviteAddComponent,
      ),
    title: 'Invite Add',
    canActivate: [authGuard],
  },
];
