/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { asEmailHtml, emailDays, emailDocument } from './email-preview';

describe('email preview helpers', () => {
  it('wraps the email in a page with a placeholder when empty', () => {
    expect(emailDocument('<p>Hi</p>')).toContain('<body><p>Hi</p></body>');
    expect(emailDocument('')).toContain('Your email appears here.');
  });

  it('works out how many days a run takes under the daily limit', () => {
    expect(emailDays(200, 250, 250)).toBe(1);
    expect(emailDays(600, 250, 250)).toBe(3);
    expect(emailDays(300, 250, 100)).toBe(2);
    expect(emailDays(300, 250, 0)).toBe(3);
    expect(emailDays(5000, null, null)).toBe(1);
  });

  it('turns plain text into HTML like the server does, and leaves HTML alone', () => {
    expect(asEmailHtml('Hi\nA & B <3')).toBe('Hi<br>\nA &amp; B &lt;3');
    expect(asEmailHtml('<p>Hi</p>\n<p>There</p>')).toBe('<p>Hi</p>\n<p>There</p>');
  });
});
