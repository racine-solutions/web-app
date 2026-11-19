/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Why no SMS reaches clients. */
export type SmsOffReason = 'SMS_NOTIFICATIONS_DISABLED' | 'SMS_ACCOUNT_INACTIVE' | 'ALL_EVENTS_DISABLED';

/** SMS credit left and whether SMS is reaching clients, from GET /sms/account/status. */
export interface SmsCreditStatus {
  /**
   * OK hides the banner. LOW and CRITICAL follow the alert levels under System > Configurations (80% and 95% of the
   * last top-up used by default). SMS_OFF means no SMS reaches clients at all.
   */
  level: 'OK' | 'LOW' | 'CRITICAL' | 'SMS_OFF';
  /** Set when the level is SMS_OFF. */
  offReason?: SmsOffReason;
  /** SMS still possible: one SMS uses one unit of credit. */
  smsBalance: number;
  /** Credit right after the last top-up. */
  topUpBalance: number;
  percentUsed: number;
  /** Cost of one SMS at the last top-up. */
  smsCost?: number;
  /** What the remaining SMS are worth at that cost. */
  balanceAmount?: number;
  /** Percent used that raises the amber banner, set under System > Configurations; absent when that alert is off. */
  lowAtPercentUsed?: number;
  /** Percent used that turns the banner red; absent when that alert is off. */
  criticalAtPercentUsed?: number;
}
