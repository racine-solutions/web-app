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
import { SearchService } from 'app/search/search.service';
import { AuthenticationService } from 'app/core/authentication/authentication.service';

import { CampaignsService } from '../campaigns.service';
import { AudienceEditorComponent } from './audience-editor.component';

describe('AudienceEditorComponent', () => {
  let fixture: ComponentFixture<AudienceEditorComponent>;
  let component: AudienceEditorComponent;
  const saveAudience = jest.fn((_name: string, _filters: any[], _id?: number) => of({}));

  beforeEach(async () => {
    saveAudience.mockClear();
    await TestBed.configureTestingModule({
      imports: [AudienceEditorComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SearchService, useValue: { getSearchResults: () => of([]) } },
        {
          provide: AuthenticationService,
          useValue: { getCredentials: () => ({ userId: 1, permissions: ['ALL_FUNCTIONS'] }) }
        },
        {
          provide: CampaignsService,
          useValue: {
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
            getSavedAudiences: () =>
              of({
                totalFilteredRecords: 1,
                pageItems: [
                  {
                    id: 2,
                    name: 'Mobile App User',
                    audience: JSON.stringify([{ field: 'GENDER', operator: 'IN', values: ['22'] }])
                  }
                ]
              }),
            countAudience: () => of({ matching: 5, recipients: 5, skipped: {} }),
            saveAudience
          }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(AudienceEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads a saved audience without filling in its name', () => {
    component.savedAudienceId = 2;
    component.loadSavedAudience();
    expect(component.filters.length).toBe(1);
    expect(component.audienceName).toBe('');
    expect(component.audienceNameHint).toBe('e.g. Mobile App User');
  });

  it('saves under the name the user types, updating an audience with the same name', () => {
    component.savedAudienceId = 2;
    component.loadSavedAudience();
    component.saveAudience();
    expect(saveAudience).not.toHaveBeenCalled();
    component.audienceName = 'mobile app user';
    component.saveAudience();
    expect(saveAudience).toHaveBeenCalledWith(
      'mobile app user',
      [{ field: 'GENDER', operator: 'IN', values: ['22'] }],
      2
    );
  });

  it('read-only mode shows the saved audience without ways to change it', () => {
    component.readOnly = true;
    component.showSave = false;
    component.savedAudienceId = 2;
    component.loadSavedAudience();
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Gender is Female');
    expect(text).not.toContain('Manage audiences');
    expect(text).not.toContain('Add filter');
    expect(text).not.toContain('Quick picks');
  });
});
