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

import { CampaignsService } from '../campaigns.service';
import { ClientCampaignMessagesComponent } from './client-campaign-messages.component';

describe('ClientCampaignMessagesComponent', () => {
  let fixture: ComponentFixture<ClientCampaignMessagesComponent>;
  const getClientMessages = jest.fn(() =>
    of({
      totalFilteredRecords: 2,
      pageItems: [
        {
          id: 2,
          campaignId: 5,
          campaignName: 'Repayment reminder',
          runNumber: 3,
          channel: 'SMS',
          address: '256785154434',
          message: 'Hi John',
          status: 'SENT',
          sentOn: '2026-11-06T18:51:00Z'
        },
        {
          id: 1,
          campaignId: 4,
          campaignName: 'Savings week',
          runNumber: 1,
          channel: 'SMS',
          address: '',
          message: null,
          status: 'SKIPPED',
          reason: 'OPTED_OUT',
          sentOn: '2026-11-05T09:00:00Z'
        }
      ]
    })
  );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientCampaignMessagesComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: CampaignsService, useValue: { getClientMessages } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ClientCampaignMessagesComponent);
    fixture.componentRef.setInput('clientId', 1);
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
  });

  it('lists the client campaign messages with their outcome', () => {
    const text = fixture.nativeElement.textContent;
    expect(getClientMessages).toHaveBeenCalledWith(1, 0, 10);
    expect(text).toContain('Repayment reminder');
    expect(text).toContain('Sent');
    expect(text).toContain('Skipped · Asked not to get marketing');
  });
});
