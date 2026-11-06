/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

import { AudienceClient, AudienceCount, AudienceFilter, reasonLabel } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';

export interface AudienceClientsDialogData {
  audience: AudienceFilter[];
  purpose: string;
  count: AudienceCount;
}

/**
 * Every client the audience matches, one page at a time, so staff can check who gets the message and who is skipped.
 * Closing it returns to the campaign as it was.
 */
@Component({
  selector: 'mifosx-audience-clients-dialog',
  templateUrl: './audience-clients-dialog.component.html',
  styleUrls: [
    '../campaigns.scss',
    './audience-clients-dialog.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatPaginator,
    MatIcon,
    MatProgressBar
  ]
})
export class AudienceClientsDialogComponent implements OnInit {
  data = inject<AudienceClientsDialogData>(MAT_DIALOG_DATA);
  private service = inject(CampaignsService);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly reasonLabel = reasonLabel;
  readonly tabs = [
    { value: 'ALL', label: 'All', count: this.data.count.matching },
    { value: 'RECIPIENTS', label: 'Will get it', count: this.data.count.recipients },
    { value: 'SKIPPED', label: 'Skipped', count: this.data.count.matching - this.data.count.recipients }
  ];

  show = 'ALL';
  search = new FormControl('');
  clients: AudienceClient[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 25;
  loading = true;

  private requests = new Subject<void>();

  ngOnInit() {
    this.requests
      .pipe(
        switchMap(() => {
          this.loading = true;
          this.changeDetector.markForCheck();
          return this.service
            .audienceClients(this.data.audience, this.data.purpose, {
              show: this.show,
              search: this.search.value || '',
              offset: this.pageIndex * this.pageSize,
              limit: this.pageSize
            })
            .pipe(catchError(() => of({ totalFilteredRecords: 0, pageItems: [] })));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((page) => {
        this.clients = page.pageItems;
        this.total = page.totalFilteredRecords;
        this.loading = false;
        this.changeDetector.markForCheck();
      });
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex = 0;
        this.requests.next();
      });
    this.requests.next();
  }

  setTab(value: string) {
    this.show = value;
    this.pageIndex = 0;
    this.requests.next();
  }

  page(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.requests.next();
  }
}
