import { Routes } from '@angular/router';
import { ContentLayoutComponent } from './shared/layouts/content-layout/content-layout.component';
import { content } from './shared/routes/content.routes';
import { AuthenticationLayoutComponent } from './shared/layouts/authentication-layout/authentication-layout.component';
import { authen } from './shared/routes/auth.routes';
import { Error403Component } from './components/error/error403/error403.component';
import { inject } from '@angular/core';
import { AuthService } from './shared/services/auth.service';
import { Router } from '@angular/router';
import { LOGIN_TYPES } from './utility/constants';

const loginGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    const orgData: any = auth.getUser();
    if (
      orgData?.login_type_id === LOGIN_TYPES.ORGANIZATION_ADMIN ||
      orgData?.login_type_id === LOGIN_TYPES.SAP_USER ||
      orgData?.login_type_id === LOGIN_TYPES.SALES_SUPPORT_USER
    ) {
      return router.createUrlTree(['/apps/invite/invite-list']);
    } else {
      return router.createUrlTree(['/apps/customers/customer-list']);
    }
  }
  return true;
};

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth/login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('../app/authentication/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'lock-screen/cover',
    loadComponent: () => import('../app/authentication/lock-screen/cover/cover.component').then((m) => m.CoverComponent),
  },
  {
    path: 'under-maintanace',
    loadComponent: () => import('../app/authentication/under-maintanace/under-maintanace.component').then((m) => m.UnderMaintanaceComponent),
  },
  { path: '', component: ContentLayoutComponent, children: content },
  { path: '', component: AuthenticationLayoutComponent, children: authen },
  { path: 'unauthorized', component: Error403Component, children: authen },
  { path: '**', redirectTo: '/error/error404', pathMatch: 'full' },
];
