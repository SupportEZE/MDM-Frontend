import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MASTER_ROUTES } from './master/master.routes';
import { AUTHENTICATION_ROUTES } from '../../authentication/authentication.route';
import { SERVICE_ROUTES } from './service/service.routes';
import { authGuard } from '../../core/auth/auth.guard';
import { INVITE_ROUTES } from './invite.routes/invite.routes.component';
import { CUSTOMER_ROUTES } from './customer.routes.ts/customer.routes.ts.component';
import { CustomerDetailComponent } from './customer-detail/customer-detail.component';
import { CustomerAddComponent } from './customer-add/customer-add.component';
import { ThankYouComponent } from './thank-you/thank-you.component';

export const admin: Routes = [
  {
    path: 'apps',
    children: [
      { path: 'invite', children: INVITE_ROUTES, canActivate: [authGuard] },
      {
        path: 'customers',
        children: CUSTOMER_ROUTES,
        canActivate: [authGuard],
      },
      {
        path: 'create-customer',
        component: CustomerAddComponent,
        title: 'Add Customer',
      },
      { path: 'master', children: MASTER_ROUTES, canActivate: [authGuard] },
      {
        path: 'thank-you/:type',
        component: ThankYouComponent,
        title: 'Thank You',
      },

      {
        path: 'customer/customer-detail/:id',
        component: CustomerDetailComponent,
        title: 'Customer Detail',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(admin)],
  exports: [RouterModule],
})
export class appsRoutingModule {
  static routes = admin;
}
