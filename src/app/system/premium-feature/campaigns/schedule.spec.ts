/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Schedule, describe as describeSchedule, firstAllowed, occurrence, quietText, upcoming } from './schedule';

const monthly: Schedule = {
  scheduleType: 'REPEAT',
  scheduledAt: '2026-11-25 09:00',
  repeatEvery: 1,
  repeatUnit: 'MONTHS',
  repeatStop: 'NEVER'
};

describe('campaign schedule', () => {
  it('keeps monthly runs on the same day', () => {
    expect(occurrence(monthly, 2)).toEqual(new Date(2027, 0, 25, 9, 0));
  });

  it('moves a 31st to the last day of shorter months', () => {
    expect(occurrence({ ...monthly, scheduledAt: '2027-01-31 09:00' }, 1)).toEqual(new Date(2027, 1, 28, 9, 0));
  });

  it('stops after the chosen number of runs or the last date', () => {
    expect(upcoming({ ...monthly, repeatStop: 'AFTER_RUNS', repeatMaxRuns: 3 }, 10)).toHaveLength(3);
    expect(upcoming({ ...monthly, repeatStop: 'ON_DATE', repeatUntil: '2027-01-31' }, 10)).toHaveLength(3);
    expect(upcoming(monthly, 4)).toHaveLength(4);
  });

  it('moves sends out of quiet hours', () => {
    const quiet: Schedule = { ...monthly, quietFrom: '08:00', quietTo: '20:00' };
    expect(firstAllowed(quiet, new Date(2026, 10, 25, 6, 30))).toEqual(new Date(2026, 10, 25, 8, 0));
    expect(firstAllowed(quiet, new Date(2026, 10, 25, 21, 0))).toEqual(new Date(2026, 10, 26, 8, 0));
    expect(firstAllowed(quiet, new Date(2026, 10, 25, 12, 0))).toEqual(new Date(2026, 10, 25, 12, 0));
    expect(quietText(quiet)).toBe('Only 08:00–20:00');
    expect(quietText(monthly)).toBe('Any time');
  });

  it('describes the schedule in words', () => {
    expect(describeSchedule({ scheduleType: 'NOW' })).toBe('As soon as approved');
    expect(
      describeSchedule({ ...monthly, repeatEvery: 2, repeatUnit: 'WEEKS', repeatStop: 'AFTER_RUNS', repeatMaxRuns: 6 })
    ).toBe('Every 2 weeks from 2026-11-25 09:00, 6 runs');
    expect(describeSchedule(monthly)).toBe('Every month from 2026-11-25 09:00, until stopped');
  });
});
