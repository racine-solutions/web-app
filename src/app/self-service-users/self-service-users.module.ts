/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { NgModule } from '@angular/core';

/** Custom Modules */
import { SharedModule } from '../shared/shared.module';
import { SelfServiceUsersRoutingModule } from './self-service-users-routing.module';

/** Custom Components */
import { SelfServiceUsersComponent } from './self-service-users.component';
import { ViewSelfServiceUserComponent } from './view-self-service-user/view-self-service-user.component';
import { ChangeAccessDialogComponent } from './change-access-dialog/change-access-dialog.component';

/** Back-office management of mobile app (self-service) users. */
@NgModule({
  imports: [
    SharedModule,
    SelfServiceUsersRoutingModule,
    SelfServiceUsersComponent,
    ViewSelfServiceUserComponent,
    ChangeAccessDialogComponent
  ]
})
export class SelfServiceUsersModule {}
