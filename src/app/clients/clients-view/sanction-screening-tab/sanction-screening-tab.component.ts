/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { ClientsService } from '../../clients.service';
import { SanctionScreeningDetailsDialogComponent } from './sanction-screening-details-dialog/sanction-screening-details-dialog.component';

/**
 * Component for Client Sanction Screening.
 */
@Component({
  selector: 'mifosx-sanction-screening-tab',
  templateUrl: './sanction-screening-tab.component.html',
  styleUrls: ['./sanction-screening-tab.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatProgressBar,
    MatChipsModule,
    MatExpansionModule,
    MatTableModule,
    MatDialogModule,
    FaIconComponent
  ]
})
export class SanctionScreeningTabComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private clientsService = inject(ClientsService);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);
  private translateService = inject(TranslateService);
  private dialog = inject(MatDialog);

  clientId: string;
  isLoading = false;
  screeningHistory: any[] = [];
  historyColumns: string[] = [
    'screeningId',
    'displayName',
    'status',
    'reviewStatus',
    'threshold',
    'actions'
  ];
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

  private destroy$ = new Subject<void>();

  constructor() {
    this.clientId = this.route.parent?.snapshot.paramMap.get('clientId') || '';
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data: { screeningHistory: any }) => {
      this.screeningHistory = Array.isArray(data.screeningHistory) ? data.screeningHistory : [];
      this.cdr.markForCheck();
    });
  }

  screenClient(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const payload = {
      locale: 'en',
      dateFormat: 'dd MMMM yyyy',
      externalPaymentId: 'PAY-XPLoo-LKIOP-AWSEDRTddd',
      installmentNumber: 10,
      newDueDate: '30 July 2026',
      snoozeFee: 2477.0,
      currency: 'SAR'
    };

    this.clientsService
      .screenClient(this.clientId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.alertService.alert({
            type: 'success',
            message: this.translateService.instant('labels.inputs.Sanction screening completed successfully')
          });
          this.reloadHistory();
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.alert({
            type: 'error',
            message:
              err?.error?.message || this.translateService.instant('labels.inputs.Failed to perform sanction screening')
          });
          this.cdr.markForCheck();
        }
      });
  }

  reloadHistory(): void {
    this.clientsService
      .getClientScreeningHistory(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.screeningHistory = Array.isArray(history) ? history : [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  showDetails(run: any): void {
    const dialogRef = this.dialog.open(SanctionScreeningDetailsDialogComponent, {
      data: run,
      width: '900px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.reloadHistory();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
