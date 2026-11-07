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
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { SearchService } from 'app/search/search.service';
import { AuthenticationService } from 'app/core/authentication/authentication.service';

import { CampaignsService } from '../campaigns.service';
import { CampaignFormComponent } from './campaign-form.component';

describe('CampaignFormComponent', () => {
  let fixture: ComponentFixture<CampaignFormComponent>;
  let component: CampaignFormComponent;
  const saveCampaign = jest.fn((_body: any, _id?: number) => of({ resourceId: 9 }));

  beforeEach(async () => {
    saveCampaign.mockClear();
    await TestBed.configureTestingModule({
      imports: [CampaignFormComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
        { provide: SearchService, useValue: { getSearchResults: () => of([]) } },
        {
          provide: AuthenticationService,
          useValue: { getCredentials: () => ({ userId: 1, permissions: ['ALL_FUNCTIONS'] }) }
        },
        { provide: HttpClient, useValue: { get: () => of({ smsCost: 25, smsBalance: 1000 }) } },
        {
          provide: CampaignsService,
          useValue: {
            getTemplates: () =>
              of({
                totalFilteredRecords: 2,
                pageItems: [
                  { id: 1, name: 'Reminder', channel: 'SMS', tag: 'Loan', purpose: 'GENERAL', text: 'Hi' },
                  {
                    id: 2,
                    name: 'Statement',
                    channel: 'EMAIL',
                    tag: 'General',
                    purpose: 'GENERAL',
                    emailSubject: 'S',
                    text: 'Hi'
                  }
                ]
              }),
            getAudienceOptions: () =>
              of({
                fields: [],
                offices: [],
                genders: [],
                clientTypes: [],
                classifications: [],
                loanProducts: [],
                delinquencyRanges: []
              }),
            countAudience: () => of({ matching: 600, recipients: 600, skipped: {} }),
            getCampaignDefaults: () =>
              of({
                quietFrom: '08:00',
                quietTo: '20:00',
                emailEnabled: true,
                emailDailyLimit: 250,
                emailsLeftToday: 250
              }),
            getSavedAudiences: () => of({ totalFilteredRecords: 0, pageItems: [] }),
            preview: () => of({ message: 'Hi', subject: 'S', length: 2, longestLength: 2, limit: 160, fits: true }),
            saveCampaign,
            act: () => of({})
          }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(CampaignFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('opens a new campaign, where the Audience step only picks a saved audience', () => {
    expect(fixture.nativeElement.textContent).toContain('Campaign name');
    const audienceStep = fixture.nativeElement.querySelector('mifosx-audience-editor');
    expect(audienceStep).not.toBeNull();
    expect(audienceStep.textContent).toContain('Saved audience');
    expect(audienceStep.textContent).not.toContain('Add filter');
    expect(audienceStep.textContent).not.toContain('Quick picks');
    expect(component.schedule).toEqual(
      expect.objectContaining({ scheduleType: 'NOW', quietFrom: '08:00', quietTo: '20:00' })
    );
  });

  it('saves the repeat and quiet-hours settings with the campaign', () => {
    component.name.setValue('Monthly reminder');
    component.templateId = 1;
    component.scheduleType = 'REPEAT';
    const next = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    component.sendDate = next;
    component.sendTime = '09:00';
    component.repeatEvery = 1;
    component.repeatUnit = 'MONTHS';
    component.repeatStop = 'AFTER_RUNS';
    component.repeatMaxRuns = 6;
    component.save(false);
    expect(saveCampaign).not.toHaveBeenCalled();
    component.audienceChanged({
      filters: [{ field: 'GENDER', operator: 'IN', values: ['22'] }],
      count: { matching: 10, recipients: 10, skipped: {} },
      counting: false,
      summary: ['Gender is Female'],
      audienceType: 'CLIENTS'
    });
    component.save(false);
    expect(saveCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduleType: 'REPEAT',
        scheduledAt: `${next} 09:00`,
        repeatEvery: 1,
        repeatUnit: 'MONTHS',
        repeatStop: 'AFTER_RUNS',
        repeatMaxRuns: 6,
        quietFrom: '08:00',
        quietTo: '20:00'
      }),
      undefined
    );
  });

  it('an email template shows the daily limit and how many days a run takes', () => {
    component.templateId = 2;
    component.templateChanged();
    fixture.detectChanges();
    component.audienceChanged({
      filters: [],
      count: { matching: 600, recipients: 600, skipped: {} },
      counting: false,
      summary: [],
      audienceType: 'CLIENTS'
    });
    expect(component.isEmail).toBe(true);
    expect(component.emailRunDays).toBe(3);
  });

  it('warns when the template does not suit a staff audience', () => {
    component.templates = [
      {
        id: 1,
        name: 'Reminder',
        channel: 'SMS',
        tag: 'Loan',
        purpose: 'GENERAL',
        text: 'Hi {{client.name}}, pay {{loans.nextDueAmount}}'
      }
    ] as any;
    component.templateId = 1;
    component.audienceChanged({
      filters: [{ field: 'RECIPIENTS', operator: 'IN', values: ['STAFF'] }],
      count: { matching: 3, recipients: 3, skipped: {} },
      counting: false,
      summary: ['Goes to staff and system users'],
      audienceType: 'STAFF'
    });
    expect(component.unsuitableTags).toEqual([
      'client.name',
      'loans.nextDueAmount'
    ]);
  });
});
