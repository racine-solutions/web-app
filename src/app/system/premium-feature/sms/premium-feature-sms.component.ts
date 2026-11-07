/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { Component, inject } from '@angular/core';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatLine } from '@angular/material/grid-list';
import { ActivatedRoute } from '@angular/router';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { SmsAccount } from './sms-account.model';

/**
 * Premium Feature SMS menu component.
 */
@Component({
  selector: 'mifosx-premium-feature-sms',
  templateUrl: './premium-feature-sms.component.html',
  styleUrls: ['./premium-feature-sms.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatNavList,
    MatListItem,
    MatIcon,
    FaIconComponent,
    MatLine
  ]
})
export class PremiumFeatureSmsComponent {
  private route = inject(ActivatedRoute);

  smsAccount!: SmsAccount;

  constructor() {
    this.route.data.subscribe((data: { smsAccount: SmsAccount }) => {
      this.smsAccount = data.smsAccount;
    });
  }

  /** SMS sent so far: everything ever credited minus what is left. One SMS uses one unit of credit. */
  get smsUsed(): number {
    const credit = this.smsAccount?.smsTotalCredit ?? 0;
    const balance = this.smsAccount?.smsTotalBalance ?? 0;
    return Math.max(0, credit - balance);
  }

  /** Share of all SMS credit ever bought that has been used, 0-100; null before any credit is bought. */
  get percentageUsed(): number | null {
    const credit = this.smsAccount?.smsTotalCredit ?? 0;
    if (credit <= 0) {
      return null;
    }
    return Math.min(100, (this.smsUsed / credit) * 100);
  }

  get accountStatusLabel(): string {
    return this.smsAccount?.isActive ? 'Active' : 'Inactive';
  }
}
