/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CampaignsService } from '../campaigns.service';
import { AudienceClientsDialogComponent } from './audience-clients-dialog.component';

describe('AudienceClientsDialogComponent', () => {
  let fixture: ComponentFixture<AudienceClientsDialogComponent>;
  const audienceClients = jest.fn((_audience: any, _purpose: string, query: any) =>
    of({
      totalFilteredRecords: 520,
      pageItems: Array.from({ length: query.limit }, (_, i) => ({
        clientId: query.offset + i + 1,
        accountNo: '0000000' + (i + 1),
        displayName: 'Client ' + (query.offset + i + 1),
        officeName: 'Head Office',
        mobileNo: i === 0 ? null : '0785154434',
        skipReason: i === 0 ? 'NO_PHONE' : undefined
      }))
    })
  );

  beforeEach(async () => {
    audienceClients.mockClear();
    await TestBed.configureTestingModule({
      imports: [AudienceClientsDialogComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: CampaignsService, useValue: { audienceClients } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            audience: [],
            purpose: 'GENERAL',
            count: { matching: 520, recipients: 468, skipped: { NO_PHONE: 52 } }
          }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(AudienceClientsDialogComponent);
    fixture.detectChanges();
  });

  it('shows the real counts, not a fixed sample size', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('All · 520');
    expect(text).toContain('Will get it · 468');
    expect(text).toContain('Skipped · 52');
  });

  it('loads one page at a time from the server', () => {
    expect(audienceClients).toHaveBeenLastCalledWith([], 'GENERAL', { show: 'ALL', search: '', offset: 0, limit: 25 });
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(25);
    fixture.componentInstance.page({ pageIndex: 2, pageSize: 50, length: 520 });
    expect(audienceClients).toHaveBeenLastCalledWith([], 'GENERAL', {
      show: 'ALL',
      search: '',
      offset: 100,
      limit: 50
    });
  });

  it('switches to skipped clients and says why', () => {
    fixture.componentInstance.setTab('SKIPPED');
    fixture.detectChanges();
    expect(audienceClients).toHaveBeenLastCalledWith([], 'GENERAL', {
      show: 'SKIPPED',
      search: '',
      offset: 0,
      limit: 25
    });
    expect(fixture.nativeElement.textContent).toContain('Skipped · No phone number');
  });
});
