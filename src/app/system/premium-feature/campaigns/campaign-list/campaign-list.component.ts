/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

import { Campaign, CampaignStatus, STATUS_LABELS, STATUS_TONE } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';
import { describe } from '../schedule';

/** All campaigns, newest first, filtered by status. */
@Component({
  selector: 'mifosx-campaign-list',
  templateUrl: './campaign-list.component.html',
  styleUrls: [
    '../campaigns.scss',
    './campaign-list.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatIcon,
    MatPaginator
  ]
})
export class CampaignListComponent implements OnInit {
  private service = inject(CampaignsService);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);

  readonly filters: { value: CampaignStatus | ''; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'PENDING_APPROVAL', label: 'Pending approval' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'SENDING', label: 'Sending' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'STOPPED', label: 'Stopped' },
    { value: 'DRAFT', label: 'Drafts' },
    { value: 'REJECTED', label: 'Rejected' }
  ];
  readonly statusLabels = STATUS_LABELS;
  readonly statusTone = STATUS_TONE;

  campaigns: Campaign[] = [];
  status: CampaignStatus | '' = '';
  loading = true;
  total = 0;
  pageIndex = 0;
  pageSize = 25;

  ngOnInit() {
    this.load();
  }

  setStatus(status: CampaignStatus | '') {
    this.status = status;
    this.pageIndex = 0;
    this.load();
  }

  page(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  open(campaign: Campaign) {
    this.router.navigate([
      '/system',
      'premium-feature',
      'campaigns',
      campaign.id
    ]);
  }

  schedule(campaign: Campaign): string {
    return describe(campaign);
  }

  private load() {
    this.loading = true;
    this.service.getCampaigns(this.status || undefined, this.pageIndex * this.pageSize, this.pageSize).subscribe({
      next: (page) => {
        this.campaigns = page.pageItems;
        this.total = page.totalFilteredRecords;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.changeDetector.markForCheck();
      }
    });
  }
}
