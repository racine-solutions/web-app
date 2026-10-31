/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { SelfServiceUser, SelfServiceUserStatus, availableCommands, statusSeverity } from './self-service-user.model';

function user(status: SelfServiceUserStatus, locked = false): SelfServiceUser {
  return { id: 1, status: { id: status, code: '', value: '' }, locked } as SelfServiceUser;
}

describe('self-service user actions', () => {
  it('offers view only, suspend, sign out, password reset and close for an active user', () => {
    expect(availableCommands(user(SelfServiceUserStatus.Active))).toEqual([
      'viewOnly',
      'suspend',
      'revokeSessions',
      'resetPassword',
      'close'
    ]);
  });

  it('offers reactivate but not password reset for a view-only user', () => {
    const commands = availableCommands(user(SelfServiceUserStatus.ViewOnly));
    expect(commands).toContain('reactivate');
    expect(commands).not.toContain('resetPassword');
  });

  it('offers only close for a pending user', () => {
    expect(availableCommands(user(SelfServiceUserStatus.Pending))).toEqual(['close']);
  });

  it('offers nothing for a closed user, even when locked', () => {
    expect(availableCommands(user(SelfServiceUserStatus.Closed, true))).toEqual([]);
  });

  it('puts unlock first for a locked user', () => {
    expect(availableCommands(user(SelfServiceUserStatus.Suspended, true))[0]).toBe('unlock');
  });

  it('maps statuses to pill colours', () => {
    expect(statusSeverity(user(SelfServiceUserStatus.Active))).toBe('active');
    expect(statusSeverity(user(SelfServiceUserStatus.ViewOnly))).toBe('viewonly');
    expect(statusSeverity(user(SelfServiceUserStatus.Suspended))).toBe('suspended');
    expect(statusSeverity(user(SelfServiceUserStatus.Closed))).toBe('closed');
    expect(statusSeverity(user(SelfServiceUserStatus.Pending))).toBe('pending');
  });
});
