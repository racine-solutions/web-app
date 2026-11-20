/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Field officer app (Mobile Officer App) data as returned by /officerapp. Timestamps are ISO-8601 UTC. */

export type OnlineStatus = 'ONLINE' | 'IDLE' | 'SIGNED_OUT';
export type AccessStatus = 'ALLOWED' | 'OFF';
export type DeviceStatus = 'ACTIVE' | 'BLOCKED';

export interface OfficerAppSummary {
  devicesConnected: number;
  onlineNow: number;
  activeToday: number;
  officersOnApp30Days: number;
  officers: number;
  accessOff: number;
  registeredDevices: number;
  blockedDevices: number;
  oldVersionDevices: number;
  minimumVersion?: string;
  appEnabled: boolean;
  sessionTimeoutMinutes: number;
  accessByDefault: boolean;
  requireSession: boolean;
  appVersions: { version: string; devices: number; belowMinimum: boolean }[];
}

export interface OfficerAppDevice {
  id: number;
  userId: number;
  username: string;
  officerName: string;
  officeName: string;
  shortCode: string;
  label: string;
  manufacturer?: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
  appBuild?: string;
  belowMinimumVersion: boolean;
  status: DeviceStatus;
  blockReason?: string;
  statusChangedBy?: string;
  statusChangedOn?: string;
  firstSeenOn?: string;
  lastSeenOn?: string;
  lastIp?: string;
  signedIn: boolean;
  onlineStatus: OnlineStatus;
}

export interface OfficerAppUser {
  userId: number;
  username: string;
  firstname: string;
  lastname: string;
  displayName: string;
  email?: string;
  officeId: number;
  officeName: string;
  staffId?: number;
  staffName?: string;
  mobileNo?: string;
  accessStatus: AccessStatus;
  /** False when no admin has decided yet and the institution default applies. */
  accessExplicit: boolean;
  accessReason?: string;
  accessChangedOn?: string;
  accessChangedBy?: string;
  onlineStatus: OnlineStatus;
  devices: number;
  blockedDevices: number;
  liveSessions: number;
  firstSeenOn?: string;
  lastSeenOn?: string;
  lastAction?: string;
  lastActionOn?: string;
  /** Staff account (web-app) status: ACTIVE, LOCKED or DISABLED. */
  webStatus: string;
  /** Detail only. */
  roles?: string[];
  deviceList?: OfficerAppDevice[];
  stats30Days?: { daysActive: number; signIns: number; actions: number; offlineSyncs: number; refused: number };
}

export interface OfficerAppEvent {
  id: number;
  userId?: number;
  username?: string;
  officeId?: number;
  deviceId?: number;
  deviceLabel?: string;
  eventType: string;
  category: string;
  result: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUSED';
  actor: 'OFFICER' | 'STAFF' | 'SYSTEM';
  staffUsername?: string;
  commandId?: number;
  entityName?: string;
  actionName?: string;
  resourceId?: number;
  clientId?: number;
  loanId?: number;
  savingsId?: number;
  amount?: number;
  currencyCode?: string;
  description: string;
  details?: string;
  ipAddress?: string;
  capturedOn?: string;
  createdOn: string;
}

export interface Page<T> {
  totalFilteredRecords: number;
  pageItems: T[];
}

export interface OfficerAppEventFilter {
  category?: string;
  result?: string;
  deviceId?: number;
}

export type OfficerCommand = 'turnOff' | 'turnOn' | 'signOutAll' | 'unlock';
export type DeviceCommand = 'block' | 'unblock' | 'signOut';

export const READ_PERMISSION = 'READ_OFFICERAPP';

export const OFFICER_COMMAND_PERMISSIONS: Record<OfficerCommand, string> = {
  turnOff: 'TURNOFF_OFFICERAPPUSER',
  turnOn: 'TURNON_OFFICERAPPUSER',
  signOutAll: 'SIGNOUTALL_OFFICERAPPUSER',
  unlock: 'UNLOCK_OFFICERAPPUSER'
};

export const DEVICE_COMMAND_PERMISSIONS: Record<DeviceCommand, string> = {
  block: 'BLOCK_OFFICERAPPDEVICE',
  unblock: 'UNBLOCK_OFFICERAPPDEVICE',
  signOut: 'SIGNOUT_OFFICERAPPDEVICE'
};

/** Access changes an admin can make for this officer now. */
export function officerCommands(user: OfficerAppUser): OfficerCommand[] {
  if (!user) {
    return [];
  }
  const commands: OfficerCommand[] = [];
  // Locked after too many failed sign-ins: blocks the web app and the field officer app until unlocked
  if (user.webStatus === 'LOCKED') {
    commands.push('unlock');
  }
  commands.push(user.accessStatus === 'OFF' ? 'turnOn' : 'turnOff');
  if (user.liveSessions > 0) {
    commands.push('signOutAll');
  }
  return commands;
}

export function deviceCommands(device: OfficerAppDevice): DeviceCommand[] {
  if (!device) {
    return [];
  }
  if (device.status === 'BLOCKED') {
    return ['unblock'];
  }
  return device.signedIn ? [
        'signOut',
        'block'
      ] : ['block'];
}

/** CSS class of the status pill. */
export function onlineSeverity(status: OnlineStatus): string {
  return status === 'ONLINE' ? 'active' : status === 'IDLE' ? 'suspended' : 'closed';
}

/** Label key (labels.status.*) for an online status. */
export function onlineLabel(status: OnlineStatus): string {
  return status === 'ONLINE' ? 'Online' : status === 'IDLE' ? 'Idle' : 'Signed out';
}
