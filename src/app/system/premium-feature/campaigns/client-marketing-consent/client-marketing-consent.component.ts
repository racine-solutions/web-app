/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

import { MarketingConsent } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';

/**
 * Whether the client gets Sales and marketing messages. Clients ask the SACCO or MFI to stop them and staff record it
 * here; general notices still reach them.
 */
@Component({
  selector: 'mifosx-client-marketing-consent',
  templateUrl: './client-marketing-consent.component.html',
  styleUrls: [
    '../campaigns.scss',
    './client-marketing-consent.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FormsModule,
    MatRadioGroup,
    MatRadioButton
  ]
})
export class ClientMarketingConsentComponent implements OnChanges {
  private service = inject(CampaignsService);
  private changeDetector = inject(ChangeDetectorRef);

  @Input() clientId: number;

  consent: MarketingConsent | null = null;
  editing = false;
  receives = true;
  note = '';
  saving = false;

  ngOnChanges() {
    if (this.clientId) {
      this.load();
    }
  }

  edit() {
    this.receives = this.consent?.receivesMarketing ?? true;
    this.note = '';
    this.editing = true;
  }

  save() {
    this.saving = true;
    this.service.saveConsent(this.clientId, this.receives, this.note).subscribe({
      next: () => {
        this.editing = false;
        this.saving = false;
        this.load();
      },
      error: () => {
        this.saving = false;
        this.changeDetector.markForCheck();
      }
    });
  }

  private load() {
    this.service.getConsent(this.clientId).subscribe({
      next: (consent) => {
        this.consent = consent;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.consent = null;
        this.changeDetector.markForCheck();
      }
    });
  }
}
