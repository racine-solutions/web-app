/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuthenticationService } from 'app/core/authentication/authentication.service';

import { Campaign } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';
import { CampaignViewComponent } from './campaign-view.component';

const campaign: Campaign = {
  id: 17,
  name: 'Arrears follow-up',
  templateId: 3,
  templateName: 'Arrears reminder',
  channel: 'SMS',
  purpose: 'GENERAL',
  tag: 'Loan',
  messageText: 'Hi {{client.name}}',
  audience: '[]',
  scheduleType: 'NOW',
  status: 'PENDING_APPROVAL',
  officeId: 1,
  officeName: 'Head Office',
  createdBy: 'Nankya Sarah',
  createdById: 5,
  createdOn: '2026-11-06T10:00:00Z',
  lastModifiedBy: 'Nankya Sarah',
  lastModifiedById: 5,
  submittedBy: 'Nankya Sarah',
  submittedOn: '2026-11-06T10:05:00Z',
  history: []
};

describe('CampaignViewComponent', () => {
  let fixture: ComponentFixture<CampaignViewComponent>;
  let userId = 9;
  const act = jest.fn(() => of({}));

  const render = () => {
    fixture = TestBed.createComponent(CampaignViewComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(async () => {
    act.mockClear();
    await TestBed.configureTestingModule({
      imports: [CampaignViewComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '17' }) } } },
        {
          provide: AuthenticationService,
          useValue: { getCredentials: () => ({ userId, permissions: ['ALL_FUNCTIONS'] }) }
        },
        {
          provide: CampaignsService,
          useValue: {
            getCampaign: () => of(campaign),
            getRuns: () => of([]),
            preview: () =>
              of({ message: 'Hi Mwesigye', length: 11, longestLength: 23, limit: 160, unicode: false, fits: true }),
            act
          }
        }
      ]
    }).compileComponents();
  });

  it('approves a pending campaign', () => {
    userId = 9;
    const page = render();
    expect(page.textContent).toContain('Pending approval');
    const approve = Array.from(page.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Approve');
    expect(approve).toBeTruthy();
    approve.click();
    expect(act).toHaveBeenCalledWith(17, 'approve', {});
  });

  it('lets the creator approve their own campaign', () => {
    userId = 5;
    const page = render();
    const approve = Array.from(page.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Approve');
    expect(approve).toBeTruthy();
    approve.click();
    expect(act).toHaveBeenCalledWith(17, 'approve', {});
  });

  it('needs a reason to reject', () => {
    userId = 9;
    render();
    const component = fixture.componentInstance;
    component.rejecting = true;
    component.reject();
    expect(act).not.toHaveBeenCalled();
    component.reason.setValue('Add the branch phone number');
    component.reject();
    expect(act).toHaveBeenCalledWith(17, 'reject', { reason: 'Add the branch phone number' });
  });
});
