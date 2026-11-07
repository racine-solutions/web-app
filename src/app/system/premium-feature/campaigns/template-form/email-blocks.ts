/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Wraps the selected text of an email body, e.g. in <b>…</b>. */
export interface EmailFormat {
  label: string;
  title: string;
  open: string;
  close: string;
  /** Each selected line becomes its own item, e.g. a list. */
  perLine?: { open: string; close: string };
}

/** A ready-made piece of email inserted at the cursor. Styles are inline, so email apps show it as designed. */
export interface EmailBlock {
  label: string;
  title: string;
  html: string;
}

const BLUE = '#1f5fbf';

export const EMAIL_FORMATS: EmailFormat[] = [
  { label: 'B', title: 'Bold', open: '<b>', close: '</b>' },
  { label: 'I', title: 'Italic', open: '<i>', close: '</i>' },
  { label: 'U', title: 'Underline', open: '<u>', close: '</u>' },
  { label: 'Heading', title: 'Large heading', open: '<h2>', close: '</h2>' },
  { label: 'Subheading', title: 'Smaller heading', open: '<h3>', close: '</h3>' },
  { label: 'Paragraph', title: 'Paragraph', open: '<p>', close: '</p>' },
  { label: 'Link', title: 'Link: put the web address between the quotes', open: '<a href="https://">', close: '</a>' },
  {
    label: '• List',
    title: 'Bulleted list: one item per line',
    open: '<ul>\n',
    close: '</ul>',
    perLine: { open: '  <li>', close: '</li>\n' }
  },
  {
    label: '1. List',
    title: 'Numbered list: one item per line',
    open: '<ol>\n',
    close: '</ol>',
    perLine: { open: '  <li>', close: '</li>\n' }
  },
  {
    label: 'Highlight',
    title: 'Highlight in colour',
    open: `<span style="color:${BLUE};font-weight:bold;">`,
    close: '</span>'
  },
  { label: 'Centre', title: 'Centre', open: '<div style="text-align:center;">', close: '</div>' }
];

export const EMAIL_BLOCKS: EmailBlock[] = [
  {
    label: 'Button',
    title: 'A call-to-action button: change the text and the web address',
    html:
      `<p><a href="https://" style="display:inline-block;background:${BLUE};color:#ffffff;padding:10px 20px;` +
      'border-radius:4px;text-decoration:none;font-weight:bold;">Find out more</a></p>\n'
  },
  {
    label: 'Info box',
    title: 'A coloured box for an important notice',
    html:
      '<div style="background:#eef4ff;border-left:4px solid #1f5fbf;padding:12px 16px;margin:12px 0;">\n' +
      '  <b>Please note:</b> write your notice here.\n' +
      '</div>\n'
  },
  {
    label: 'Details table',
    title: "A table of the client's figures; remove or add rows as needed",
    html:
      '<table style="border-collapse:collapse;margin:12px 0;">\n' +
      '  <tr><td style="padding:6px 16px 6px 0;color:#666;">Loan balance</td><td style="padding:6px 0;"><b>{{loans.totalOutstanding}}</b></td></tr>\n' +
      '  <tr><td style="padding:6px 16px 6px 0;color:#666;">Next payment</td><td style="padding:6px 0;"><b>{{loans.nextDueAmount}}</b> on {{loans.nextDueDate}}</td></tr>\n' +
      '  <tr><td style="padding:6px 16px 6px 0;color:#666;">Savings balance</td><td style="padding:6px 0;"><b>{{savings.totalBalance}}</b></td></tr>\n' +
      '</table>\n'
  },
  {
    label: 'Divider',
    title: 'A line across the email',
    html: '<hr style="border:0;border-top:1px solid #dddddd;margin:16px 0;">\n'
  },
  { label: 'Line break', title: 'Start a new line', html: '<br>\n' },
  {
    label: 'Image',
    title: 'An image: put its web address between the quotes',
    html: '<p><img src="https://" alt="Picture" style="max-width:100%;"></p>\n'
  },
  {
    label: 'Signature',
    title: 'Sign off from the institution',
    html: '<p>Kind regards,<br>\n<b>{{tenant.name}}</b><br>\n{{client.office}}</p>\n'
  },
  {
    label: 'Footer',
    title: 'Small print at the bottom of the email',
    html:
      '<p style="font-size:12px;color:#888888;border-top:1px solid #eeeeee;padding-top:8px;margin-top:24px;">\n' +
      '  You get this email because you are a member of {{tenant.name}}. Questions? Visit {{client.office}} or ask your\n' +
      '  loan officer, {{client.loanOfficer}}.\n' +
      '</p>\n'
  }
];
