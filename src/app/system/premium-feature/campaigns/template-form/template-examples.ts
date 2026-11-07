/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** A ready-made message staff can start from and then change. */
export interface TemplateExample {
  label: string;
  channel: 'SMS' | 'EMAIL';
  name: string;
  tag: string;
  purpose: 'GENERAL' | 'MARKETING';
  emailSubject?: string;
  text: string;
}

/** SMS examples fit one SMS even with the longest client details. */
export const TEMPLATE_EXAMPLES: TemplateExample[] = [
  {
    label: 'Repayment reminder',
    channel: 'SMS',
    name: 'Repayment reminder',
    tag: 'Loan',
    purpose: 'GENERAL',
    text: 'Hi {{client.name}}, your loan payment of {{loans.nextDueAmount}} is due on {{loans.nextDueDate}}. Please pay on time. {{tenant.name}}'
  },
  {
    label: 'Overdue loan',
    channel: 'SMS',
    name: 'Overdue loan',
    tag: 'Loan',
    purpose: 'GENERAL',
    text: 'Hi {{client.name}}, your loan is {{loans.daysInArrears}} days late with {{loans.arrearsAmount}} unpaid. Please pay today or call us. {{tenant.name}}'
  },
  {
    label: 'Savings balance',
    channel: 'SMS',
    name: 'Savings balance',
    tag: 'Savings',
    purpose: 'GENERAL',
    text: 'Hi {{client.name}}, your savings balance is {{savings.totalBalance}}. Keep saving with {{tenant.name}}!'
  },
  {
    label: 'Birthday wishes',
    channel: 'SMS',
    name: 'Birthday wishes',
    tag: 'General',
    purpose: 'MARKETING',
    text: 'Happy birthday {{client.firstName}}! Wishing you a great year from all of us at {{tenant.name}}.'
  },
  {
    label: 'Account summary',
    channel: 'EMAIL',
    name: 'Account summary email',
    tag: 'General',
    purpose: 'GENERAL',
    emailSubject: 'Your account summary, {{client.name}}',
    text:
      'Hi {{client.name}},\n\n' +
      'Here is a summary of your accounts with {{tenant.name}}:\n\n' +
      'Loan balance: {{loans.totalOutstanding}}\n' +
      'Next payment: {{loans.nextDueAmount}} on {{loans.nextDueDate}}\n' +
      'Savings balance: {{savings.totalBalance}}\n\n' +
      'If anything looks wrong, please visit {{client.office}} or call us.\n\n' +
      'Thank you,\n{{tenant.name}}'
  },
  {
    label: 'Loan offer (HTML)',
    channel: 'EMAIL',
    name: 'Loan offer email',
    tag: 'Loan',
    purpose: 'MARKETING',
    emailSubject: '{{client.name}}, a loan offer for you',
    text:
      '<h2>Hi {{client.name}},</h2>\n' +
      '<p>Thank you for banking with <b>{{tenant.name}}</b>. You can now apply for a new loan with quick approval.</p>\n' +
      '<p>Visit <b>{{client.office}}</b> to find out how much you can borrow.</p>\n' +
      '<p>Kind regards,<br>{{tenant.name}}</p>'
  }
];

/** Shown inside the empty message box. */
export const SMS_HINT =
  'e.g. Hi {{client.name}}, your loan payment of {{loans.nextDueAmount}} is due on {{loans.nextDueDate}}.';
export const EMAIL_HINT =
  'e.g. Hi {{client.name}},\n\nYour savings balance is {{savings.totalBalance}}.\n\nThank you,\n{{tenant.name}}';
export const SUBJECT_HINT = 'e.g. Your account update, {{client.name}}';
