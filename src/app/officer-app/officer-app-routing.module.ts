/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Route } from '../core/route/route.service';

import { OfficerAppComponent } from './officer-app.component';
import { ViewOfficerComponent } from './view-officer/view-officer.component';
import { OfficerResolver } from './officer.resolver';

const routes: Routes = [
  Route.withShell([
    {
      path: '',
      data: { title: 'Mobile Officer App', breadcrumb: 'Mobile Officer App' },
      children: [
        {
          path: '',
          component: OfficerAppComponent
        },
        {
          path: ':id',
          component: ViewOfficerComponent,
          data: {
            title: 'Mobile Officer App User',
            routeResolveBreadcrumb: [
              'officer',
              'displayName'
            ]
          },
          resolve: { officer: OfficerResolver }
        }
      ]
    }
  ])
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [OfficerResolver]
})
export class OfficerAppRoutingModule {}
