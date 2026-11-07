/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { SearchService } from 'app/search/search.service';
import { AuthenticationService } from 'app/core/authentication/authentication.service';

import { CampaignsService } from '../campaigns.service';
import { AudienceFormComponent } from './audience-form.component';

describe('AudienceFormComponent', () => {
  const saveAudience = jest.fn((_name: string, _filters: any[], _id?: number) => of({ resourceId: 4 }));
  const countAudience = jest.fn((_filters: any[], _purpose: string, _channel?: string) =>
    of({ matching: 40, recipients: 38, skipped: { NO_PHONE: 2 } })
  );
  const saved = {
    id: 3,
    name: 'Women with savings',
    audience: JSON.stringify([{ field: 'GENDER', operator: 'IN', values: ['22'] }]),
    officeName: 'Head Office',
    createdBy: 'App Administrator',
    updatedOn: '2026-11-06T10:00:00Z'
  };

  async function create(params: Record<string, string>): Promise<ComponentFixture<AudienceFormComponent>> {
    saveAudience.mockClear();
    countAudience.mockClear();
    await TestBed.configureTestingModule({
      imports: [AudienceFormComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
        { provide: SearchService, useValue: { getSearchResults: () => of([]) } },
        {
          provide: AuthenticationService,
          useValue: { getCredentials: () => ({ userId: 1, permissions: ['ALL_FUNCTIONS'] }) }
        },
        {
          provide: CampaignsService,
          useValue: {
            audienceClients: () => of({ totalFilteredRecords: 0, pageItems: [] }),
            getAudienceOptions: () =>
              of({
                fields: [{ field: 'GENDER', label: 'Gender' }],
                offices: [],
                genders: [{ id: 22, name: 'Female' }],
                clientTypes: [],
                classifications: [],
                loanProducts: [],
                delinquencyRanges: []
              }),
            getSavedAudiences: () => of({ totalFilteredRecords: 1, pageItems: [saved] }),
            countAudience,
            saveAudience
          }
        }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(AudienceFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('builds and saves a new audience on its own page', async () => {
    const fixture = await create({});
    const router = TestBed.inject(Router);
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('Review clients');
    expect(fixture.nativeElement.textContent).not.toContain('Template');
    expect(component.canSave).toBe(false);

    component.name.setValue('Female clients');
    component.audienceChanged({
      filters: [{ field: 'GENDER', operator: 'IN', values: ['22'] }],
      count: { matching: 40, recipients: 38, skipped: {} },
      counting: false,
      summary: ['Gender is Female'],
      audienceType: 'CLIENTS'
    });
    expect(component.canSave).toBe(true);
    component.save();
    expect(saveAudience).toHaveBeenCalledWith(
      'Female clients',
      [{ field: 'GENDER', operator: 'IN', values: ['22'] }],
      undefined
    );
    expect(navigate).toHaveBeenCalledWith([
      '/system',
      'premium-feature',
      'campaigns',
      'audiences'
    ]);
  });

  it('opens a saved audience for editing and saves it under its id', async () => {
    const fixture = await create({ audienceId: '3' });
    const component = fixture.componentInstance;
    jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    expect(component.name.value).toBe('Women with savings');
    expect(component.initialFilters).toEqual([{ field: 'GENDER', operator: 'IN', values: ['22'] }]);
    component.audienceChanged({
      filters: component.initialFilters!,
      count: null,
      counting: false,
      summary: [],
      audienceType: 'CLIENTS'
    });
    component.save();
    expect(saveAudience).toHaveBeenCalledWith('Women with savings', component.initialFilters, 3);
  });

  it('counts for email and marketing when chosen', async () => {
    const fixture = await create({});
    const component = fixture.componentInstance;
    component.channel = 'EMAIL';
    component.marketing = true;
    expect(component.purpose).toBe('MARKETING');
  });

  it('left-out clients are saved as an "all but these" filter', async () => {
    const fixture = await create({});
    const component = fixture.componentInstance;
    component.audienceChanged({
      filters: [{ field: 'GENDER', operator: 'IN', values: ['22'] }],
      count: null,
      counting: false,
      summary: ['Gender is Female'],
      audienceType: 'CLIENTS'
    });
    const client = (id: number, name: string) =>
      ({ clientId: id, accountNo: '0001', displayName: name, officeName: 'Head Office', mobileNo: '0785' }) as any;
    component.toggle(client(5, 'Joseph'));
    component.toggle(client(6, 'Kassim'));
    component.toggle(client(6, 'Kassim'));
    expect(component.excludedList).toEqual([{ id: '5', name: 'Joseph' }]);
    expect(component.filtersToSave).toEqual([
      { field: 'GENDER', operator: 'IN', values: ['22'] },
      { field: 'CLIENT', operator: 'NOT_IN', values: ['5'] }
    ]);
  });

  it('joins left-out clients to an existing "all but these" filter', async () => {
    const fixture = await create({});
    const component = fixture.componentInstance;
    component.audienceChanged({
      filters: [{ field: 'CLIENT', operator: 'NOT_IN', values: ['1'] }],
      count: null,
      counting: false,
      summary: [],
      audienceType: 'CLIENTS'
    });
    component.toggle({ clientId: 7, displayName: 'Campaign Test' } as any);
    expect(component.filtersToSave).toEqual([{ field: 'CLIENT', operator: 'NOT_IN', values: [
          '1',
          '7'
        ] }]);
  });

  it('staff audiences leave people out by their staff or user key', async () => {
    const fixture = await create({});
    const component = fixture.componentInstance;
    component.audienceType = 'STAFF';
    component.typeChanged();
    component.audienceChanged({
      filters: [
        { field: 'RECIPIENTS', operator: 'IN', values: ['STAFF'] },
        { field: 'STAFF_TYPE', operator: 'IN', values: ['LOAN_OFFICER'] }
      ],
      count: null,
      counting: false,
      summary: [],
      audienceType: 'STAFF'
    });
    component.toggle({ clientId: null, displayName: 'Sarah', recipientType: 'STAFF', recipientKey: 'STAFF:3' } as any);
    expect(component.purpose).toBe('GENERAL');
    expect(component.filtersToSave).toEqual([
      { field: 'RECIPIENTS', operator: 'IN', values: ['STAFF'] },
      { field: 'STAFF_TYPE', operator: 'IN', values: ['LOAN_OFFICER'] },
      { field: 'STAFF_MEMBER', operator: 'NOT_IN', values: ['STAFF:3'] }
    ]);
  });
});
