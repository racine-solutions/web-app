/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** A self-service (mobile app) user as returned by GET /selfserviceusers. Timestamps are ISO-8601 UTC. */
export interface SelfServiceUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  displayName: string;
  email: string;
  mobileNo?: string;
  officeId: number;
  officeName: string;
  clientId?: number;
  clientAccountNo?: string;
  clientDisplayName?: string;
  status: { id: number; code: string; value: string };
  locked: boolean;
  passwordResetRequired: boolean;
  statusReason?: string;
  statusChangedOn?: string;
  statusChangedBy?: string;
  createdOn?: string;
  lastLoginOn?: string;
  openSessions?: number;
  lastSessionStartedOn?: string;
  /** Profile only. */
  limits?: SelfServiceUserLimit[];
  clients?: SelfServiceUserClient[];
}

/** Per-currency transfer limits; today's usage is what the user already transferred in the app today. */
export interface SelfServiceUserLimit {
  currencyCode: string;
  perTransferLimit?: number;
  dailyLimit?: number;
  usedToday?: number;
  updatedOn?: string;
  updatedBy?: string;
}

export interface SelfServiceUserClient {
  id: number;
  accountNo: string;
  displayName: string;
  officeId: number;
  officeName: string;
}

export interface SelfServiceUserPage {
  totalFilteredRecords: number;
  pageItems: SelfServiceUser[];
}

export interface SelfServiceUserSummary {
  total: number;
  pending: number;
  active: number;
  viewOnly: number;
  suspended: number;
  closed: number;
  locked: number;
  loggedInLast30Days: number;
}

/** Status values used by the API (status filter and status.id). */
export enum SelfServiceUserStatus {
  Pending = 100,
  Active = 300,
  ViewOnly = 400,
  Suspended = 500,
  Closed = 600
}

/** ?command= values of POST /selfserviceusers/{id}. */
export type SelfServiceUserCommand =
  | 'viewOnly'
  | 'suspend'
  | 'reactivate'
  | 'close'
  | 'unlock'
  | 'revokeSessions'
  | 'resetPassword';

/** Permission needed for each command (ACTION_SELFSERVICEUSER). */
export const COMMAND_PERMISSIONS: Record<SelfServiceUserCommand, string> = {
  viewOnly: 'VIEWONLY_SELFSERVICEUSER',
  suspend: 'SUSPEND_SELFSERVICEUSER',
  reactivate: 'REACTIVATE_SELFSERVICEUSER',
  close: 'CLOSE_SELFSERVICEUSER',
  unlock: 'UNLOCK_SELFSERVICEUSER',
  revokeSessions: 'REVOKESESSIONS_SELFSERVICEUSER',
  resetPassword: 'RESETPASSWORD_SELFSERVICEUSER'
};

export const UPDATE_LIMITS_PERMISSION = 'UPDATELIMITS_SELFSERVICEUSER';
export const UPDATE_CLIENTS_PERMISSION = 'UPDATECLIENTS_SELFSERVICEUSER';

/** CSS severity class for a status pill. */
export function statusSeverity(user: SelfServiceUser): string {
  switch (user?.status?.id) {
    case SelfServiceUserStatus.Active:
      return 'active';
    case SelfServiceUserStatus.ViewOnly:
      return 'viewonly';
    case SelfServiceUserStatus.Suspended:
      return 'suspended';
    case SelfServiceUserStatus.Closed:
      return 'closed';
    default:
      return 'pending';
  }
}

/** Commands staff can run for a user in its current state (before permission checks). */
export function availableCommands(user: SelfServiceUser): SelfServiceUserCommand[] {
  const commands: SelfServiceUserCommand[] = [];
  switch (user?.status?.id) {
    case SelfServiceUserStatus.Active:
      commands.push('viewOnly', 'suspend', 'revokeSessions', 'resetPassword', 'close');
      break;
    case SelfServiceUserStatus.ViewOnly:
      commands.push('reactivate', 'suspend', 'revokeSessions', 'close');
      break;
    case SelfServiceUserStatus.Suspended:
      commands.push('reactivate', 'viewOnly', 'close');
      break;
    case SelfServiceUserStatus.Pending:
      commands.push('close');
      break;
    default:
      break;
  }
  if (user?.locked && user?.status?.id !== SelfServiceUserStatus.Closed) {
    commands.unshift('unlock');
  }
  return commands;
}
