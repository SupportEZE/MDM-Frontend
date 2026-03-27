import { Routes } from '@angular/router';
import { authGuard } from '../../../core/auth/auth.guard';
import { INVITE_CHILD_ROUTES } from '../invite-child.routes/invite-child.routes.component';

export const INVITE_ROUTES: Routes = [
  {
    path: 'invite-list', loadComponent: () => import('../invite-list/invite-list.component').then(m => m.InviteListComponent), title: 'Invite List', canActivate: [authGuard],
  },

  {
     path: 'invite-add', loadComponent: () => import('../invite-add/invite-add.component').then(m => m.InviteAddComponent), title: 'Invite Add', canActivate: [authGuard],
  },

];
