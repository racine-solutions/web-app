/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuthenticationService } from 'app/core/authentication/authentication.service';

import { CampaignsService } from '../campaigns.service';
import { CampaignListComponent } from './campaign-list.component';

describe('CampaignListComponent', () => {
  let fixture: ComponentFixture<CampaignListComponent>;
  const getCampaigns = jest.fn((_status: string | undefined, offset: number, limit: number) =>
    of({
      totalFilteredRecords: 120,
      pageItems: Array.from({ length: limit }, (_, i) => ({
        id: offset + i + 1,
        name: 'Campaign ' + (offset + i + 1),
        templateName: 'Reminder',
        tag: 'Loan',
        channel: 'SMS',
        purpose: 'GENERAL',
        scheduleType: 'NOW',
        status: 'COMPLETED',
        createdBy: 'App Administrator'
      }))
    })
  );

  beforeEach(async () => {
    getCampaigns.mockClear();
    await TestBed.configureTestingModule({
      imports: [CampaignListComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: CampaignsService, useValue: { getCampaigns } },
        { provide: AuthenticationService, useValue: { getCredentials: () => ({ permissions: ['ALL_FUNCTIONS'] }) } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(CampaignListComponent);
    fixture.detectChanges();
  });

  it('loads the first page only', () => {
    expect(getCampaigns).toHaveBeenLastCalledWith(undefined, 0, 25);
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(25);
  });

  it('moves between pages', () => {
    fixture.componentInstance.page({ pageIndex: 2, pageSize: 50, length: 120 });
    expect(getCampaigns).toHaveBeenLastCalledWith(undefined, 100, 50);
  });

  it('goes back to the first page when the status filter changes', () => {
    fixture.componentInstance.page({ pageIndex: 3, pageSize: 25, length: 120 });
    fixture.componentInstance.setStatus('COMPLETED');
    expect(getCampaigns).toHaveBeenLastCalledWith('COMPLETED', 0, 25);
  });
});
