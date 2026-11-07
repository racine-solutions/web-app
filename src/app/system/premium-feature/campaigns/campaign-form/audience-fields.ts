/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AudienceOptions, Option } from '../campaigns.model';

/** How each audience field is edited. */
export type FieldKind = 'options' | 'choice' | 'range' | 'number' | 'clients';

export interface FieldSpec {
  kind: FieldKind;
  /** For options: whether "is none of" is allowed. */
  negatable?: boolean;
  /** For options: where the values come from. */
  source?: keyof AudienceOptions | 'static';
  staticOptions?: { value: string; label: string }[];
  /** For number and range: the unit shown next to the box. */
  unit?: string;
  placeholderMin?: string;
  placeholderMax?: string;
  /** For number: the word before the box, e.g. "In the last" (default "Within"). */
  numberLabel?: string;
}

const YES_NO = [
  { value: 'YES', label: 'Yes' },
  { value: 'NO', label: 'No' }
];

export const FIELD_SPECS: Record<string, FieldSpec> = {
  CLIENT: { kind: 'clients', negatable: true },
  OFFICE: { kind: 'options', source: 'offices' },
  CLIENT_STATUS: {
    kind: 'options',
    source: 'static',
    staticOptions: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'CLOSED', label: 'Closed' }
    ]
  },
  GENDER: { kind: 'options', source: 'genders', negatable: true },
  AGE: { kind: 'range', unit: 'years', placeholderMin: 'From', placeholderMax: 'To' },
  BIRTHDAY: {
    kind: 'choice',
    staticOptions: [
      { value: 'TODAY', label: 'Today' },
      { value: 'THIS_MONTH', label: 'This month' }
    ]
  },
  CLIENT_TYPE: { kind: 'options', source: 'clientTypes', negatable: true },
  CLASSIFICATION: { kind: 'options', source: 'classifications', negatable: true },
  LEGAL_FORM: {
    kind: 'options',
    source: 'static',
    staticOptions: [
      { value: 'PERSON', label: 'Person' },
      { value: 'ENTITY', label: 'Entity' }
    ]
  },
  NEW_CLIENTS: { kind: 'number', unit: 'days', numberLabel: 'In the last' },
  HAS_ACTIVE_LOAN: { kind: 'choice', staticOptions: YES_NO },
  LOAN_PRODUCT: { kind: 'options', source: 'loanProducts', negatable: true },
  NEXT_DUE: { kind: 'number', unit: 'days' },
  DELINQUENCY: { kind: 'options', source: 'delinquencyRanges', negatable: true },
  LOAN_REPAID: { kind: 'number', unit: 'days', numberLabel: 'In the last' },
  HAS_SAVINGS: { kind: 'choice', staticOptions: YES_NO },
  SAVINGS_BALANCE: { kind: 'range', placeholderMin: 'At least', placeholderMax: 'At most' },
  HAS_FIXED_DEPOSIT: { kind: 'choice', staticOptions: YES_NO },
  FD_MATURING: { kind: 'number', unit: 'days' },
  HAS_RECURRING_DEPOSIT: { kind: 'choice', staticOptions: YES_NO },
  HAS_SHARES: { kind: 'choice', staticOptions: YES_NO },
  SHARES: { kind: 'number', unit: 'shares', numberLabel: 'At least' },
  MOBILE_APP: {
    kind: 'choice',
    staticOptions: [
      { value: 'USES', label: 'Uses the app' },
      { value: 'NEVER_LOGGED_IN', label: 'Signed up, never logged in' },
      { value: 'NOT_ON_APP', label: 'Not on the app' }
    ]
  },
  INACTIVE: { kind: 'number', unit: 'days', numberLabel: 'In the last' },
  LOAN_OFFICER: { kind: 'options', source: 'loanOfficers', negatable: true },
  GROUP: { kind: 'options', source: 'groups', negatable: true },
  IN_GROUP: { kind: 'choice', staticOptions: YES_NO },
  MEMBER_FOR: { kind: 'range', unit: 'years', placeholderMin: 'From', placeholderMax: 'To' },
  HAS_PHONE: { kind: 'choice', staticOptions: YES_NO },
  HAS_EMAIL: { kind: 'choice', staticOptions: YES_NO },
  LOAN_PURPOSE: { kind: 'options', source: 'loanPurposes', negatable: true },
  LOAN_BALANCE: { kind: 'range', placeholderMin: 'At least', placeholderMax: 'At most' },
  DAYS_IN_ARREARS: { kind: 'range', unit: 'days late', placeholderMin: 'From', placeholderMax: 'To' },
  LOAN_ENDING: { kind: 'number', unit: 'days' },
  LOAN_DISBURSED: { kind: 'number', unit: 'days', numberLabel: 'In the last' },
  LOANS_TAKEN: { kind: 'range', unit: 'loans', placeholderMin: 'At least', placeholderMax: 'At most' },
  LOAN_PENDING: { kind: 'choice', staticOptions: YES_NO },
  SAVINGS_PRODUCT: { kind: 'options', source: 'savingsProducts', negatable: true },
  NO_DEPOSIT_IN: { kind: 'number', unit: 'days', numberLabel: 'In the last' },
  IS_STAFF: { kind: 'choice', staticOptions: YES_NO },
  // Staff audiences
  STAFF_TYPE: {
    kind: 'options',
    source: 'static',
    staticOptions: [
      { value: 'LOAN_OFFICER', label: 'Loan officers' },
      { value: 'SYSTEM_USER', label: 'Has a system login' },
      { value: 'NO_LOGIN', label: 'No system login' }
    ]
  },
  STAFF_OFFICE: { kind: 'options', source: 'offices' },
  STAFF_ROLE: { kind: 'options', source: 'roles', negatable: true },
  STAFF_MEMBER: { kind: 'options', source: 'staffPeople', negatable: true },
  STAFF_IS_CLIENT: { kind: 'choice', staticOptions: YES_NO }
};

/** Ready-made audiences for common groups. */
export const QUICK_PICKS: { label: string; filter: { field: string; operator?: string; values: string[] } }[] = [
  { label: 'New clients (30 days)', filter: { field: 'NEW_CLIENTS', values: ['30'] } },
  { label: 'Loan payment due in 3 days', filter: { field: 'NEXT_DUE', values: ['3'] } },
  { label: 'Birthday this month', filter: { field: 'BIRTHDAY', values: ['THIS_MONTH'] } },
  { label: 'Share holders', filter: { field: 'HAS_SHARES', values: ['YES'] } },
  { label: 'Mobile app users', filter: { field: 'MOBILE_APP', values: ['USES'] } },
  { label: 'Fixed deposit maturing in 30 days', filter: { field: 'FD_MATURING', values: ['30'] } },
  { label: 'In arrears 30+ days', filter: { field: 'DAYS_IN_ARREARS', values: [
        '30',
        ''
      ] } },
  { label: 'Loan ending in 30 days', filter: { field: 'LOAN_ENDING', values: ['30'] } },
  { label: 'New borrowers (30 days)', filter: { field: 'LOAN_DISBURSED', values: ['30'] } },
  { label: 'Pending loan applications', filter: { field: 'LOAN_PENDING', values: ['YES'] } },
  { label: 'No savings deposit in 60 days', filter: { field: 'NO_DEPOSIT_IN', values: ['60'] } },
  { label: 'Repeat borrowers', filter: { field: 'LOANS_TAKEN', values: [
        '2',
        ''
      ] } }
];

/** Ready-made staff audiences. */
export const STAFF_QUICK_PICKS: { label: string; filter: { field: string; operator?: string; values: string[] } }[] = [
  { label: 'Loan officers', filter: { field: 'STAFF_TYPE', values: ['LOAN_OFFICER'] } },
  { label: 'System users', filter: { field: 'STAFF_TYPE', values: ['SYSTEM_USER'] } },
  { label: 'Staff who are also clients', filter: { field: 'STAFF_IS_CLIENT', values: ['YES'] } }
];

export function optionsFor(spec: FieldSpec, options: AudienceOptions | null): { value: string; label: string }[] {
  if (spec.source === 'static' || !spec.source) {
    return spec.staticOptions || [];
  }
  const list = ((options?.[spec.source] as unknown as Option[]) || []) as Option[];
  return list.map((option) => ({ value: String(option.id), label: option.name }));
}
