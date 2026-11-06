/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

import {
  AudienceFilter,
  Campaign,
  CampaignRun,
  HISTORY_LABELS,
  MessageCheck,
  STATUS_LABELS,
  STATUS_TONE,
  reasonLabel
} from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';
import { describe, quietText } from '../schedule';

/** One campaign: approval, actions, runs and history. */
@Component({
  selector: 'mifosx-campaign-view',
  templateUrl: './campaign-view.component.html',
  styleUrls: [
    '../campaigns.scss',
    './campaign-view.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatIcon
  ]
})
export class CampaignViewComponent implements OnInit {
  private service = inject(CampaignsService);
  private route = inject(ActivatedRoute);
  private changeDetector = inject(ChangeDetectorRef);

  readonly statusLabels = STATUS_LABELS;
  readonly statusTone = STATUS_TONE;
  readonly historyLabels = HISTORY_LABELS;
  readonly reasonLabel = reasonLabel;
  readonly scheduleText = describe;
  readonly quietText = quietText;

  campaign: Campaign | null = null;
  runs: CampaignRun[] = [];
  preview: MessageCheck | null = null;
  filters: AudienceFilter[] = [];
  rejecting = false;
  reason = new FormControl('', [
    Validators.required,
    Validators.maxLength(500)
  ]);
  busy = false;

  ngOnInit() {
    this.load();
  }

  get id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  get editable(): boolean {
    return !!this.campaign && [
        'DRAFT',
        'REJECTED',
        'PENDING_APPROVAL',
        'SCHEDULED'
      ].includes(this.campaign.status);
  }

  act(command: string, body: any = {}) {
    this.busy = true;
    this.service.act(this.id, command, body).subscribe({
      next: () => {
        this.rejecting = false;
        this.reason.reset();
        this.load();
      },
      error: () => {
        this.busy = false;
        this.changeDetector.markForCheck();
      }
    });
  }

  reject() {
    if (this.reason.invalid) {
      this.reason.markAsTouched();
      return;
    }
    this.act('reject', { reason: this.reason.value });
  }

  load() {
    this.service.getCampaign(this.id).subscribe((campaign) => {
      this.campaign = campaign;
      this.filters = JSON.parse(campaign.audience || '[]');
      this.busy = false;
      this.service.preview({ text: campaign.messageText }).subscribe((preview) => {
        this.preview = preview;
        this.changeDetector.markForCheck();
      });
      this.changeDetector.markForCheck();
    });
    this.service.getRuns(this.id).subscribe((runs) => {
      this.runs = runs;
      this.changeDetector.markForCheck();
    });
  }

  describe(filter: AudienceFilter): string {
    const values = (filter.values || []).filter((value) => value !== '').join(', ');
    return `${filter.field.replace(/_/g, ' ').toLowerCase()} ${filter.operator === 'NOT_IN' ? 'not ' : ''}${values}`;
  }
}
