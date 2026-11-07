/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatCheckbox } from '@angular/material/checkbox';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

import { CampaignRun, Delivery, EMAIL_EVENT_LABELS, REASON_LABELS, reasonLabel } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';

/** Delivery report for one run: who got the message, who didn't and why, with retry. */
@Component({
  selector: 'mifosx-campaign-run',
  templateUrl: './campaign-run.component.html',
  styleUrls: [
    '../campaigns.scss',
    './campaign-run.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FormsModule,
    MatIcon,
    MatPaginator,
    MatCheckbox
  ]
})
export class CampaignRunComponent implements OnInit {
  private service = inject(CampaignsService);
  private route = inject(ActivatedRoute);
  private changeDetector = inject(ChangeDetectorRef);

  readonly reasonLabel = reasonLabel;
  readonly reasons = Object.keys(REASON_LABELS);
  readonly eventLabels = EMAIL_EVENT_LABELS;

  /** SMS or EMAIL, from the campaign. */
  channel = 'SMS';

  run: CampaignRun | null = null;
  deliveries: Delivery[] = [];
  total = 0;
  status = 'FAILED';
  reason = '';
  pageSize = 50;
  pageIndex = 0;
  selected = new Set<number>();
  busy = false;
  message = '';

  get campaignId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  get runId(): number {
    return Number(this.route.snapshot.paramMap.get('runId'));
  }

  ngOnInit() {
    this.service.getCampaign(this.campaignId).subscribe((campaign) => {
      this.channel = campaign.channel;
      this.changeDetector.markForCheck();
    });
    this.loadRun();
  }

  get isEmail(): boolean {
    return this.channel === 'EMAIL';
  }

  get reasonBars(): { reason: string; count: number; width: number; skipped: boolean }[] {
    const entries = Object.entries(this.run?.reasons || {});
    const max = Math.max(
      1,
      ...entries.map(
        ([
          ,
          count
        ]) => count
      )
    );
    return entries
      .sort((a, b) => b[1] - a[1])
      .map(
        ([
          reason,
          count
        ]) => ({
          reason,
          count,
          width: Math.round((count / max) * 100),
          skipped: [
            'NO_PHONE',
            'INVALID_PHONE',
            'PHONE_SHARED',
            'NO_EMAIL',
            'EMAIL_SHARED',
            'OPTED_OUT',
            'STOPPED'
          ].includes(reason)
        })
      );
  }

  setStatus(status: string) {
    this.status = status;
    this.pageIndex = 0;
    this.selected.clear();
    this.loadDeliveries();
  }

  page(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDeliveries();
  }

  toggle(delivery: Delivery) {
    if (this.selected.has(delivery.id)) {
      this.selected.delete(delivery.id);
    } else {
      this.selected.add(delivery.id);
    }
  }

  retry(onlySelected: boolean) {
    this.busy = true;
    this.message = '';
    this.service.retry(this.campaignId, this.runId, onlySelected ? Array.from(this.selected) : undefined).subscribe({
      next: (result) => {
        const queued = result?.changes?.queued ?? 0;
        this.message = `${queued} message${queued === 1 ? '' : 's'} queued again. They go out within a minute.`;
        this.selected.clear();
        this.busy = false;
        this.loadRun();
      },
      error: () => {
        this.busy = false;
        this.changeDetector.markForCheck();
      }
    });
  }

  /** Every recipient of the run as CSV (up to 5,000 rows). */
  exportCsv() {
    this.service
      .getDeliveries(this.campaignId, this.runId, { status: this.status, reason: this.reason, offset: 0, limit: 5000 })
      .subscribe((page) => {
        const quote = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = [
          [
            'Client',
            'Account',
            this.isEmail ? 'Email' : 'Phone',
            'Status',
            'Reason',
            ...(this.isEmail ? ['Email result'] : []),
            'Attempts',
            'Last attempt',
            ...(this.isEmail ? ['Subject'] : []),
            'Message'
          ],
          ...page.pageItems.map((d) => [
            d.clientName,
            d.accountNo,
            d.address,
            d.status,
            reasonLabel(d.reason),
            ...(this.isEmail ? [EMAIL_EVENT_LABELS[d.providerEvent || ''] || ''] : []),
            d.attempts,
            d.lastAttemptOn || '',
            ...(this.isEmail ? [d.subject || ''] : []),
            d.message || ''
          ])
        ];
        const csv = rows.map((row) => row.map(quote).join(',')).join('\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        link.download = `campaign-${this.campaignId}-run-${this.run?.runNumber || this.runId}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      });
  }

  private loadRun() {
    this.service.getRun(this.campaignId, this.runId).subscribe((run) => {
      this.run = run;
      if (this.status === 'FAILED' && !run.failed) {
        this.status = '';
      }
      this.loadDeliveries();
      this.changeDetector.markForCheck();
    });
  }

  loadDeliveries() {
    this.service
      .getDeliveries(this.campaignId, this.runId, {
        status: this.status,
        reason: this.reason,
        offset: this.pageIndex * this.pageSize,
        limit: this.pageSize
      })
      .subscribe((page) => {
        this.deliveries = page.pageItems;
        this.total = page.totalFilteredRecords;
        this.changeDetector.markForCheck();
      });
  }
}
