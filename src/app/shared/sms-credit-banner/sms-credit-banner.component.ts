/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpContext } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

/** Custom Imports */
import { environment } from '../../../environments/environment';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { SmsCreditStatus, SmsOffReason } from './sms-credit-status.model';
import { SmsCreditStatusService } from './sms-credit-status.service';
import { SKIP_GLOBAL_ERROR_HANDLER } from 'app/core/http/error-handler.interceptor';

/** The fix offered for each reason SMS is off, to staff allowed to make it. */
const SMS_OFF_ACTIONS: Record<SmsOffReason, { label: string; route: string[]; permission: string } | null> = {
  SMS_NOTIFICATIONS_DISABLED: {
    label: 'labels.text.Switch SMS on',
    route: [
      '/system',
      'configurations'
    ],
    permission: 'UPDATE_CONFIGURATION'
  },
  ALL_EVENTS_DISABLED: {
    label: 'labels.text.Choose SMS events',
    route: [
      '/system',
      'sms-event-configuration'
    ],
    permission: 'SMS_EVENT_CONFIGURATION'
  },
  // The SMS account cannot be activated from the app
  SMS_ACCOUNT_INACTIVE: null
};

/**
 * Warns every staff user when clients are not getting SMS, or soon won't: red when SMS is switched off, amber when
 * credit is running low and red when it is nearly or fully used up. It refreshes on the same timer as the
 * notifications tray.
 */
@Component({
  selector: 'mifosx-sms-credit-banner',
  templateUrl: './sms-credit-banner.component.html',
  styleUrls: ['./sms-credit-banner.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    DecimalPipe,
    MatAnchor,
    MatIcon
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmsCreditBannerComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private statusService = inject(SmsCreditStatusService);

  /** Wait time between status calls, shared with the notifications tray (60 seconds by default). */
  waitTime = environment.waitTimeForNotifications || 60;
  /** Latest status; the banner shows only while it is LOW or CRITICAL. */
  status: SmsCreditStatus | null = null;
  /** Timer for the next refresh. */
  timer: any;

  ngOnInit() {
    this.fetchStatus();
    // A setting saved anywhere in the app shows here at once, not on the next tick
    this.statusService.refreshRequested.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.fetchStatus());
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
  }

  get visible(): boolean {
    return !!this.status && this.status.level !== 'OK';
  }

  /** Red: SMS is off, or credit is nearly or fully used up. */
  get critical(): boolean {
    return this.status?.level === 'CRITICAL' || this.smsOff;
  }

  get smsOff(): boolean {
    return this.status?.level === 'SMS_OFF';
  }

  /** The configured alert level this banner has crossed, so staff see why it is showing. */
  get alertLevel(): number | undefined {
    if (!this.status || this.smsOff) {
      return undefined;
    }
    return this.status.level === 'CRITICAL'
      ? (this.status.criticalAtPercentUsed ?? this.status.lowAtPercentUsed)
      : this.status.lowAtPercentUsed;
  }

  /** The fix for why SMS is off, or null when there is nothing the app can do. */
  get offAction() {
    return this.smsOff && this.status.offReason ? SMS_OFF_ACTIONS[this.status.offReason] : null;
  }

  /**
   * Fetches the status, then schedules the next fetch. A failed call keeps the banner as it was and is retried on the
   * next tick, without the global error dialog: a warning banner must never interrupt the user.
   */
  fetchStatus() {
    clearTimeout(this.timer);
    this.http
      .get<SmsCreditStatus>('/sms/account/status', {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLER, true)
      })
      .subscribe({
        next: (status: SmsCreditStatus) => {
          this.status = status;
          this.changeDetector.markForCheck();
        },
        error: () => {}
      });
    this.timer = setTimeout(() => this.fetchStatus(), this.waitTime * 1000);
  }
}
