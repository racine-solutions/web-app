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
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AuthenticationService } from 'app/core/authentication/authentication.service';

import { CampaignsService } from '../campaigns.service';
import { SavedAudiencesComponent } from './saved-audiences.component';

describe('SavedAudiencesComponent', () => {
  let fixture: ComponentFixture<SavedAudiencesComponent>;
  const open = jest.fn();
  const countAudience = jest.fn(() => of({ matching: 12, recipients: 10, skipped: { NO_PHONE: 2 } }));
  const audience = {
    id: 3,
    name: 'Women with savings',
    audience: JSON.stringify([{ field: 'GENDER', operator: 'IN', values: ['22'] }]),
    officeName: 'Head Office',
    createdBy: 'App Administrator',
    updatedOn: '2026-11-06T10:00:00Z'
  };

  beforeEach(async () => {
    open.mockClear();
    countAudience.mockClear();
    await TestBed.configureTestingModule({
      imports: [SavedAudiencesComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: AuthenticationService,
          useValue: { getCredentials: () => ({ userId: 1, permissions: ['ALL_FUNCTIONS'] }) }
        },
        {
          provide: CampaignsService,
          useValue: {
            getSavedAudiences: () => of({ totalFilteredRecords: 1, pageItems: [audience] }),
            countAudience,
            deleteSavedAudience: () => of({})
          }
        }
      ]
    })
      .overrideProvider(MatDialog, { useValue: { open } })
      .compileComponents();
    fixture = TestBed.createComponent(SavedAudiencesComponent);
    fixture.detectChanges();
  });

  it('offers a New audience button and actions for each audience', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('New audience');
    expect(text).toContain('View clients');
    expect(text).toContain('Use in campaign');
    expect(text).toContain('Edit');
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((a: any) => a.getAttribute('href'));
    expect(links).toContain('/system/premium-feature/campaigns/audiences/create');
    expect(links).toContain('/system/premium-feature/campaigns/audiences/3/edit');
    expect(links).toContain('/system/premium-feature/campaigns/create?audience=3');
  });

  it('counts the audience and shows its clients', () => {
    fixture.componentInstance.viewClients(audience);
    expect(countAudience).toHaveBeenCalledWith([{ field: 'GENDER', operator: 'IN', values: ['22'] }], 'GENERAL');
    expect(open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Women with savings',
          count: { matching: 12, recipients: 10, skipped: { NO_PHONE: 2 } }
        })
      })
    );
  });
});
