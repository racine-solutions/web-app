/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Communication campaigns (RPAY-140): shapes returned by /comm/... */

export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'SCHEDULED'
  | 'SENDING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'STOPPED'
  | 'REJECTED';

export type DeliveryStatus = 'QUEUED' | 'SENT' | 'FAILED' | 'SKIPPED';

export interface CommTemplate {
  id: number;
  name: string;
  channel: 'SMS' | 'EMAIL';
  tag: string;
  purpose: 'GENERAL' | 'MARKETING';
  emailSubject?: string;
  text: string;
  archived: boolean;
  length: number;
  longestLength: number;
  limit: number;
  unicode: boolean;
  campaignsUsingIt: number;
}

export interface Placeholder {
  key: string;
  label: string;
  group: string;
  example: string;
  maxLength: number;
}

export interface MessageCheck {
  message: string;
  length: number;
  longestLength: number;
  limit: number;
  unicode: boolean;
  fits: boolean;
}

export interface AudienceFilter {
  field: string;
  operator?: string;
  values: string[];
  includeChildren?: boolean;
}

export interface AudienceCount {
  matching: number;
  recipients: number;
  skipped: Record<string, number>;
}

export interface AudienceClient {
  clientId: number;
  accountNo: string;
  displayName: string;
  officeName: string;
  mobileNo: string;
  skipReason?: string;
}

export interface Paged<T> {
  totalFilteredRecords: number;
  pageItems: T[];
}

export interface AudienceClientPage {
  totalFilteredRecords: number;
  pageItems: AudienceClient[];
}

export interface Option {
  id: number;
  name: string;
}

export interface AudienceOptions {
  fields: { field: string; label: string }[];
  offices: Option[];
  genders: Option[];
  clientTypes: Option[];
  classifications: Option[];
  loanProducts: Option[];
  delinquencyRanges: (Option & { min_age_days?: number; max_age_days?: number })[];
}

export interface CampaignRun {
  id: number;
  campaignId: number;
  runNumber: number;
  startedOn: string;
  finishedOn?: string;
  recipients: number;
  queued: number;
  sent: number;
  failed: number;
  skipped: number;
  retryable: number;
  reasons: Record<string, number>;
}

export interface CampaignHistory {
  id: number;
  action: string;
  note?: string;
  user: string;
  createdOn: string;
}

export interface Campaign {
  id: number;
  name: string;
  templateId: number;
  templateName: string;
  channel: string;
  purpose: 'GENERAL' | 'MARKETING';
  tag: string;
  messageText: string;
  audience: string;
  scheduleType: 'NOW' | 'ONCE';
  scheduledAt?: string;
  nextRunAt?: string;
  status: CampaignStatus;
  lastError?: string;
  officeId: number;
  officeName: string;
  createdBy: string;
  createdById: number;
  createdOn: string;
  lastModifiedBy: string;
  lastModifiedById: number;
  submittedBy?: string;
  submittedOn?: string;
  approvedBy?: string;
  approvedOn?: string;
  rejectedBy?: string;
  rejectedOn?: string;
  rejectionReason?: string;
  lastRun?: CampaignRun;
  history: CampaignHistory[];
}

export interface Delivery {
  id: number;
  clientId: number;
  clientName: string;
  accountNo: string;
  channel: string;
  address: string;
  message: string;
  status: DeliveryStatus;
  reason?: string;
  retryable: boolean;
  attempts: number;
  lastAttemptOn?: string;
}

export interface DeliveryPage {
  totalFilteredRecords: number;
  pageItems: Delivery[];
}

export interface MarketingConsent {
  clientId: number;
  receivesMarketing: boolean;
  note?: string;
  changedBy?: string;
  changedOn?: string;
}

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  SCHEDULED: 'Scheduled',
  SENDING: 'Sending',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  STOPPED: 'Stopped',
  REJECTED: 'Rejected'
};

/** Chip colour for each status. */
export const STATUS_TONE: Record<CampaignStatus, string> = {
  DRAFT: 'grey',
  PENDING_APPROVAL: 'amber',
  SCHEDULED: 'blue',
  SENDING: 'amber',
  PAUSED: 'grey',
  COMPLETED: 'green',
  STOPPED: 'red',
  REJECTED: 'red'
};

export const REASON_LABELS: Record<string, string> = {
  NO_PHONE: 'No phone number',
  INVALID_PHONE: 'Invalid phone number',
  PHONE_SHARED: 'Phone shared with another client',
  OPTED_OUT: 'Asked not to get marketing',
  NO_SMS_CREDIT: 'No SMS credit',
  SMS_OFF: 'SMS switched off',
  SMS_ACCOUNT_INACTIVE: 'SMS account inactive',
  GATEWAY_REFUSED: 'Gateway refused',
  SEND_ERROR: 'Sending error',
  STOPPED: 'Campaign stopped'
};

export const HISTORY_LABELS: Record<string, string> = {
  CREATED: 'Created',
  UPDATED: 'Changed',
  SUBMITTED: 'Submitted for approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAUSED: 'Paused',
  RESUMED: 'Resumed',
  STOPPED: 'Stopped',
  RETRIED: 'Retry queued',
  RUN_STARTED: 'Sending started',
  RUN_FINISHED: 'Sending finished',
  WAITING: 'Waiting'
};

export function reasonLabel(reason?: string): string {
  return reason ? REASON_LABELS[reason] || reason : '';
}
