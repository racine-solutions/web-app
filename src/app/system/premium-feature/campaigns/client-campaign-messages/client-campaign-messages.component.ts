/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, inject } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

import { ClientCampaignMessage, reasonLabel } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';

/** Campaign messages this client received, failed or was skipped for, newest first. */
@Component({
  selector: 'mifosx-client-campaign-messages',
  templateUrl: './client-campaign-messages.component.html',
  styleUrls: [
    '../campaigns.scss',
    '../client-marketing-consent/client-marketing-consent.component.scss',
    './client-campaign-messages.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatPaginator
  ]
})
export class ClientCampaignMessagesComponent implements OnChanges {
  private service = inject(CampaignsService);
  private changeDetector = inject(ChangeDetectorRef);

  @Input() clientId: number;

  readonly reasonLabel = reasonLabel;
  messages: ClientCampaignMessage[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  loaded = false;

  ngOnChanges() {
    if (this.clientId) {
      this.pageIndex = 0;
      this.load();
    }
  }

  page(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  private load() {
    this.service.getClientMessages(this.clientId, this.pageIndex * this.pageSize, this.pageSize).subscribe({
      next: (page) => {
        this.messages = page.pageItems;
        this.total = page.totalFilteredRecords;
        this.loaded = true;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loaded = false;
        this.changeDetector.markForCheck();
      }
    });
  }
}
