/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface SmsWalletTransaction {
  id: number;
  amount: number;
  smsCost: number;
  smsCredit: number;
  previousBalance: number;
  note: string;
  createdOnUtc: string;
}

export interface SmsWalletTransactionsPage {
  totalFilteredRecords: number;
  pageItems: SmsWalletTransaction[];
}
