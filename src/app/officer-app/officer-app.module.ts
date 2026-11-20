/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { OfficerAppRoutingModule } from './officer-app-routing.module';

import { OfficerAppComponent } from './officer-app.component';
import { ViewOfficerComponent } from './view-officer/view-officer.component';
import { AccessDialogComponent } from './access-dialog/access-dialog.component';

/** Admin › Mobile Officer App: staff use of the field officer Android app. */
@NgModule({
  imports: [
    SharedModule,
    OfficerAppRoutingModule,
    OfficerAppComponent,
    ViewOfficerComponent,
    AccessDialogComponent
  ]
})
export class OfficerAppModule {}
