/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { ClientsService } from 'app/clients/clients.service';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslateService } from '@ngx-translate/core';

/**
 * Dialog to show details of a client sanction screening run.
 */
@Component({
  selector: 'mifosx-sanction-screening-details-dialog',
  templateUrl: './sanction-screening-details-dialog.component.html',
  styleUrls: ['./sanction-screening-details-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDialogModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    FaIconComponent
  ]
})
export class SanctionScreeningDetailsDialogComponent {
  sdnColumns: string[] = [
    'entityID',
    'sdnName',
    'sdnType',
    'program',
    'title',
    'match',
    'remarks'
  ];
  ukColumns: string[] = [
    'names',
    'datesOfBirth',
    'townsOfBirth',
    'countries',
    'match',
    'otherInfos'
  ];

  dialogRef = inject<MatDialogRef<SanctionScreeningDetailsDialogComponent>>(MatDialogRef);
  run = inject(MAT_DIALOG_DATA);
  private clientsService = inject(ClientsService);
  private alertService = inject(AlertService);
  private translateService = inject(TranslateService);

  reviewScreening(status: string): void {
    this.clientsService.reviewClientScreening(this.run.screeningId, { status }).subscribe({
      next: () => {
        this.alertService.alert({
          type: 'success',
          message: this.translateService.instant('labels.inputs.Screening review submitted successfully')
        });
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.alertService.alert({
          type: 'error',
          message:
            err?.error?.message || this.translateService.instant('labels.inputs.Failed to submit screening review')
        });
      }
    });
  }
}
