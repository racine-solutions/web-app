/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AuthenticationService } from 'app/core/authentication/authentication.service';

import { SmsCreditBannerComponent } from './sms-credit-banner.component';
import { SmsCreditStatus } from './sms-credit-status.model';
import { SmsCreditStatusService } from './sms-credit-status.service';
import { SKIP_GLOBAL_ERROR_HANDLER } from 'app/core/http/error-handler.interceptor';

describe('SmsCreditBannerComponent', () => {
  let fixture: ComponentFixture<SmsCreditBannerComponent>;
  let response: () => any;
  const get = jest.fn((..._args: any[]) => response());

  const status = (level: SmsCreditStatus['level'], smsBalance: number, percentUsed: number): SmsCreditStatus => ({
    level,
    smsBalance,
    topUpBalance: 1000,
    percentUsed,
    smsCost: 35,
    balanceAmount: smsBalance * 35
  });

  const render = (value: () => any) => {
    response = value;
    fixture = TestBed.createComponent(SmsCreditBannerComponent);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.sms-credit-banner') as HTMLElement | null;
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    get.mockClear();
    await TestBed.configureTestingModule({
      imports: [
        SmsCreditBannerComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideRouter([]),
        { provide: HttpClient, useValue: { get } },
        { provide: AuthenticationService, useValue: { getCredentials: () => ({ permissions: ['ALL_FUNCTIONS'] }) } }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    jest.useRealTimers();
  });

  it('stays hidden while credit is fine', () => {
    expect(render(() => of(status('OK', 900, 10)))).toBeNull();
  });

  it('shows an amber warning once 80% is used', () => {
    const banner = render(() => of(status('LOW', 200, 80)));
    expect(banner).not.toBeNull();
    expect(banner.classList).not.toContain('critical');
  });

  it('shows the alert level set in the configurations next to the usage', () => {
    const banner = render(() => of({ ...status('LOW', 800, 80), lowAtPercentUsed: 70, criticalAtPercentUsed: 90 }));
    expect(fixture.componentInstance.alertLevel).toBe(70);
    expect(banner.textContent).toContain('labels.text.SMS credit alert level');
  });

  it('shows the red level once that is crossed', () => {
    render(() => of({ ...status('CRITICAL', 300, 93), lowAtPercentUsed: 70, criticalAtPercentUsed: 90 }));
    expect(fixture.componentInstance.alertLevel).toBe(90);
  });

  it('turns red at 95% used', () => {
    expect(render(() => of(status('CRITICAL', 50, 95))).classList).toContain('critical');
  });

  it('is red when SMS is switched off, whatever the credit', () => {
    const banner = render(() => of({ ...status('SMS_OFF', 900, 10), offReason: 'SMS_NOTIFICATIONS_DISABLED' }));
    expect(banner.classList).toContain('critical');
    expect(banner.textContent).toContain('labels.text.SMS off title SMS_NOTIFICATIONS_DISABLED');
    expect(banner.querySelector('a').getAttribute('href')).toBe('/system/configurations');
  });

  it('points to the SMS events when every event is off', () => {
    const banner = render(() => of({ ...status('SMS_OFF', 900, 10), offReason: 'ALL_EVENTS_DISABLED' }));
    expect(banner.classList).toContain('critical');
    expect(banner.querySelector('a').getAttribute('href')).toBe('/system/sms-event-configuration');
  });

  it('offers no fix the app cannot make for an inactive SMS account', () => {
    const banner = render(() => of({ ...status('SMS_OFF', 0, 100), offReason: 'SMS_ACCOUNT_INACTIVE' }));
    expect(banner.textContent).toContain('labels.text.SMS off detail SMS_ACCOUNT_INACTIVE');
    expect(banner.querySelector('a')).toBeNull();
  });

  it('refreshes on the notifications timer', () => {
    render(() => of(status('OK', 900, 10)));
    expect(get).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(fixture.componentInstance.waitTime * 1000);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('asks for the call to skip the global error alert', () => {
    render(() => of(status('OK', 900, 10)));
    const options = (get.mock.calls[0] as any[])[1];
    expect(options.context.get(SKIP_GLOBAL_ERROR_HANDLER)).toBe(true);
  });

  it('checks again at once when a setting is saved', () => {
    render(() => of(status('OK', 900, 10)));
    expect(get).toHaveBeenCalledTimes(1);
    TestBed.inject(SmsCreditStatusService).requestRefresh();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('keeps quiet and retries when the call fails', () => {
    expect(render(() => throwError(() => new Error('offline')))).toBeNull();
    jest.advanceTimersByTime(fixture.componentInstance.waitTime * 1000);
    expect(get).toHaveBeenCalledTimes(2);
  });
});
