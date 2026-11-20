/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  OfficerAppDevice,
  OfficerAppUser,
  deviceCommands,
  officerCommands,
  onlineLabel,
  onlineSeverity
} from './officer-app.model';

function officer(change: Partial<OfficerAppUser>): OfficerAppUser {
  return { accessStatus: 'ALLOWED', liveSessions: 0, ...change } as OfficerAppUser;
}

function device(change: Partial<OfficerAppDevice>): OfficerAppDevice {
  return { status: 'ACTIVE', signedIn: false, ...change } as OfficerAppDevice;
}

describe('officer app model', () => {
  it('offers turn off while access is allowed, and sign out only with open sessions', () => {
    expect(officerCommands(officer({}))).toEqual(['turnOff']);
    expect(officerCommands(officer({ liveSessions: 2 }))).toEqual([
      'turnOff',
      'signOutAll'
    ]);
  });

  it('offers turn on while access is off', () => {
    expect(officerCommands(officer({ accessStatus: 'OFF' }))).toEqual(['turnOn']);
  });

  it('offers only unblock for a blocked device', () => {
    expect(deviceCommands(device({ status: 'BLOCKED', signedIn: true }))).toEqual(['unblock']);
  });

  it('offers sign out only for a signed-in device', () => {
    expect(deviceCommands(device({ signedIn: true }))).toEqual([
      'signOut',
      'block'
    ]);
    expect(deviceCommands(device({}))).toEqual(['block']);
  });

  it('maps online status to pill and label', () => {
    expect(onlineSeverity('ONLINE')).toBe('active');
    expect(onlineSeverity('IDLE')).toBe('suspended');
    expect(onlineSeverity('SIGNED_OUT')).toBe('closed');
    expect(onlineLabel('SIGNED_OUT')).toBe('Signed out');
  });
});
