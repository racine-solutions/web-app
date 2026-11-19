/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** When a campaign runs; mirrors CampaignSchedule on the server. */

export type ScheduleType = 'NOW' | 'ONCE' | 'REPEAT';
export type RepeatUnit = 'DAYS' | 'WEEKS' | 'MONTHS';
export type RepeatStop = 'NEVER' | 'ON_DATE' | 'AFTER_RUNS';

export interface Schedule {
  scheduleType: ScheduleType;
  /** yyyy-MM-dd HH:mm, tenant time */
  scheduledAt?: string | null;
  repeatEvery?: number | null;
  repeatUnit?: RepeatUnit | null;
  repeatStop?: RepeatStop | null;
  /** yyyy-MM-dd */
  repeatUntil?: string | null;
  repeatMaxRuns?: number | null;
  /** HH:mm; both empty means any time */
  quietFrom?: string | null;
  quietTo?: string | null;
}

const UNIT_WORDS: Record<RepeatUnit, [
    string,
    string
  ]> = {
  DAYS: [
    'day',
    'days'
  ],
  WEEKS: [
    'week',
    'weeks'
  ],
  MONTHS: [
    'month',
    'months'
  ]
};

function parse(value: string): Date {
  const [
    date,
    time
  ] = value.split(' ');
  const [
    y,
    m,
    d
  ] = date.split('-').map(Number);
  const [
    h,
    min
  ] = (time || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
}

/** Run number index + 1; months keep the day of the month (31 Jan → 28 Feb, as on the server). */
export function occurrence(schedule: Schedule, index: number): Date {
  const start = parse(schedule.scheduledAt);
  if (schedule.scheduleType !== 'REPEAT' || index === 0) {
    return start;
  }
  const steps = index * (schedule.repeatEvery || 1);
  const next = new Date(start);
  if (schedule.repeatUnit === 'DAYS') {
    next.setDate(start.getDate() + steps);
  } else if (schedule.repeatUnit === 'WEEKS') {
    next.setDate(start.getDate() + steps * 7);
  } else {
    const day = start.getDate();
    next.setDate(1);
    next.setMonth(start.getMonth() + steps);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, lastDay));
  }
  return next;
}

/** The first time sending is allowed at or after the given time. */
export function firstAllowed(schedule: Schedule, time: Date): Date {
  if (!schedule.quietFrom || !schedule.quietTo) {
    return time;
  }
  const minutes = (value: string) => {
    const [
      h,
      m
    ] = value.split(':').map(Number);
    return h * 60 + m;
  };
  const clock = time.getHours() * 60 + time.getMinutes();
  const from = minutes(schedule.quietFrom);
  if (clock >= from && clock < minutes(schedule.quietTo)) {
    return time;
  }
  const opening = new Date(time);
  opening.setHours(Math.floor(from / 60), from % 60, 0, 0);
  if (clock >= from) {
    opening.setDate(opening.getDate() + 1);
  }
  return opening;
}

/** Up to count run times, moved out of quiet hours. */
export function upcoming(schedule: Schedule, count: number): Date[] {
  if (schedule.scheduleType === 'NOW' || !schedule.scheduledAt) {
    return [];
  }
  const times: Date[] = [];
  for (let index = 0; times.length < count; index++) {
    const next = occurrence(schedule, index);
    if (schedule.repeatStop === 'AFTER_RUNS' && index >= (schedule.repeatMaxRuns || 0)) {
      break;
    }
    if (schedule.repeatStop === 'ON_DATE' && schedule.repeatUntil && next > parse(`${schedule.repeatUntil} 23:59`)) {
      break;
    }
    times.push(firstAllowed(schedule, next));
    if (schedule.scheduleType !== 'REPEAT') {
      break;
    }
  }
  return times;
}

/** "Every 2 weeks from 25 Nov 2026 09:00, 6 runs", in words. */
export function describe(schedule: Schedule): string {
  if (schedule.scheduleType === 'NOW') {
    return 'As soon as approved';
  }
  if (schedule.scheduleType === 'ONCE') {
    return `Once, ${schedule.scheduledAt}`;
  }
  const every = schedule.repeatEvery || 1;
  const words = UNIT_WORDS[schedule.repeatUnit || 'MONTHS'];
  let text = `Every ${every === 1 ? words[0] : every + ' ' + words[1]} from ${schedule.scheduledAt}`;
  if (schedule.repeatStop === 'AFTER_RUNS') {
    text += `, ${schedule.repeatMaxRuns} run${schedule.repeatMaxRuns === 1 ? '' : 's'}`;
  } else if (schedule.repeatStop === 'ON_DATE') {
    text += `, until ${schedule.repeatUntil}`;
  } else {
    text += ', until stopped';
  }
  return text;
}

export function quietText(schedule: Schedule): string {
  return schedule.quietFrom && schedule.quietTo ? `Only ${schedule.quietFrom}–${schedule.quietTo}` : 'Any time';
}
