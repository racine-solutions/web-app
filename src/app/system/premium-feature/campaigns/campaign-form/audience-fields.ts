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
  NEW_CLIENTS: { kind: 'number', unit: 'days' },
  HAS_ACTIVE_LOAN: { kind: 'choice', staticOptions: YES_NO },
  LOAN_PRODUCT: { kind: 'options', source: 'loanProducts', negatable: true },
  NEXT_DUE: { kind: 'number', unit: 'days' },
  DELINQUENCY: { kind: 'options', source: 'delinquencyRanges', negatable: true },
  LOAN_REPAID: { kind: 'number', unit: 'days' },
  HAS_SAVINGS: { kind: 'choice', staticOptions: YES_NO },
  SAVINGS_BALANCE: { kind: 'range', placeholderMin: 'At least', placeholderMax: 'At most' },
  HAS_FIXED_DEPOSIT: { kind: 'choice', staticOptions: YES_NO },
  FD_MATURING: { kind: 'number', unit: 'days' },
  HAS_RECURRING_DEPOSIT: { kind: 'choice', staticOptions: YES_NO },
  HAS_SHARES: { kind: 'choice', staticOptions: YES_NO },
  SHARES: { kind: 'number', unit: 'shares' },
  MOBILE_APP: {
    kind: 'choice',
    staticOptions: [
      { value: 'USES', label: 'Uses the app' },
      { value: 'NEVER_LOGGED_IN', label: 'Signed up, never logged in' },
      { value: 'NOT_ON_APP', label: 'Not on the app' }
    ]
  },
  INACTIVE: { kind: 'number', unit: 'days' }
};

/** Ready-made audiences for common groups. */
export const QUICK_PICKS: { label: string; filter: { field: string; operator?: string; values: string[] } }[] = [
  { label: 'New clients (30 days)', filter: { field: 'NEW_CLIENTS', values: ['30'] } },
  { label: 'Loan payment due in 3 days', filter: { field: 'NEXT_DUE', values: ['3'] } },
  { label: 'Birthday this month', filter: { field: 'BIRTHDAY', values: ['THIS_MONTH'] } },
  { label: 'Share holders', filter: { field: 'HAS_SHARES', values: ['YES'] } },
  { label: 'Mobile app users', filter: { field: 'MOBILE_APP', values: ['USES'] } },
  { label: 'Fixed deposit maturing in 30 days', filter: { field: 'FD_MATURING', values: ['30'] } }
];

export function optionsFor(spec: FieldSpec, options: AudienceOptions | null): { value: string; label: string }[] {
  if (spec.source === 'static' || !spec.source) {
    return spec.staticOptions || [];
  }
  const list = ((options?.[spec.source] as Option[]) || []) as Option[];
  return list.map((option) => ({ value: String(option.id), label: option.name }));
}
