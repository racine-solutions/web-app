/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * A whole page for an email preview frame, with readable default styles for plain emails. Show it in an iframe with a
 * sandbox (no allow-scripts, no allow-same-origin), so the email's HTML can't run scripts or reach the app.
 */
export function emailDocument(html: string | null | undefined): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8"><base target="_blank">' +
    '<style>body{font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222;margin:16px;}' +
    'img{max-width:100%;}</style></head><body>' +
    (html || '<p style="color:#888">Your email appears here.</p>') +
    '</body></html>'
  );
}

/** Days a run of this many emails takes under the daily limit, given what is left of today's allowance. */
export function emailDays(
  recipients: number,
  dailyLimit: number | null | undefined,
  leftToday: number | null | undefined
) {
  if (!dailyLimit || dailyLimit <= 0 || recipients <= 0) {
    return 1;
  }
  const today = Math.max(0, leftToday ?? dailyLimit);
  return recipients <= today ? 1 : 1 + Math.ceil((recipients - today) / dailyLimit);
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** As the server sends it: plain text keeps its line breaks; a body with HTML tags is used as written. */
export function asEmailHtml(text: string): string {
  if (/<\/?[a-zA-Z][^>]*>/.test(text)) {
    return text;
  }
  return escapeHtml(text)
    .replace(/&quot;/g, '"')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '<br>\n');
}
