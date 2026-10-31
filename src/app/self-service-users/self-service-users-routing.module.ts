/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/** Routing Imports */
import { Route } from '../core/route/route.service';

/** Custom Imports */
import { SelfServiceUsersComponent } from './self-service-users.component';
import { SelfServiceReportsComponent } from './self-service-reports/self-service-reports.component';
import { ViewSelfServiceUserComponent } from './view-self-service-user/view-self-service-user.component';
import { SelfServiceUserResolver } from './self-service-user.resolver';

const routes: Routes = [
  Route.withShell([
    {
      path: '',
      data: { title: 'Self Service Users', breadcrumb: 'Self Service Users' },
      children: [
        {
          path: '',
          component: SelfServiceUsersComponent
        },
        {
          path: 'reports',
          component: SelfServiceReportsComponent,
          data: { title: 'Mobile App Reports', breadcrumb: 'Reports' }
        },
        {
          path: ':id',
          component: ViewSelfServiceUserComponent,
          data: {
            title: 'View Self Service User',
            routeResolveBreadcrumb: [
              'user',
              'displayName'
            ]
          },
          resolve: { user: SelfServiceUserResolver }
        }
      ]
    }
  ])
];

/** Back-office management of mobile app (self-service) users. */
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [SelfServiceUserResolver]
})
export class SelfServiceUsersRoutingModule {}
