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
import { SearchService } from 'app/search/search.service';

import { CampaignsService } from '../campaigns.service';
import { TemplateFormComponent } from './template-form.component';

describe('TemplateFormComponent', () => {
  let fixture: ComponentFixture<TemplateFormComponent>;
  let component: TemplateFormComponent;
  const saveTemplate = jest.fn(() => of({}));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateFormComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
        { provide: SearchService, useValue: { getSearchResults: () => of([]) } },
        {
          provide: CampaignsService,
          useValue: {
            getPlaceholders: () =>
              of([
                { key: 'client.name', label: 'Client name', group: 'Client', example: 'Mwesigye', maxLength: 20 },
                {
                  key: 'loans.nextDueAmount',
                  label: 'Next due amount',
                  group: 'Loans',
                  example: 'UGX 85,000',
                  maxLength: 17
                }
              ]),
            getTags: () =>
              of([
                'General',
                'Loan'
              ]),
            preview: () => of(null),
            getCampaignDefaults: () => of({ emailEnabled: true }),
            saveTemplate
          }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('counts each placeholder at its longest value', () => {
    component.form.controls.text.setValue('Hi {{client.name}}, pay {{loans.nextDueAmount}}.');
    expect(component.longestLength).toBe('Hi , pay .'.length + 20 + 17);
    expect(component.limit).toBe(160);
    expect(component.fits).toBe(true);
  });

  it('drops to 70 characters for accented text and blocks saving when too long', () => {
    component.form.patchValue({
      name: 'Promo',
      tag: 'General',
      text: 'Hola {{client.name}}, su código: ' + 'x'.repeat(40)
    });
    expect(component.limit).toBe(70);
    expect(component.fits).toBe(false);
    component.save();
    expect(saveTemplate).not.toHaveBeenCalled();
  });

  it('inserts a placeholder where the cursor is', () => {
    const textarea = document.createElement('textarea');
    component.form.controls.text.setValue('Hi , welcome');
    textarea.value = 'Hi , welcome';
    textarea.selectionStart = textarea.selectionEnd = 3;
    component.insert({ key: 'client.name', label: '', group: '', example: '', maxLength: 20 }, textarea);
    expect(component.form.controls.text.value).toBe('Hi {{client.name}}, welcome');
  });

  it('an email needs a subject but no SMS length check, and is saved with it', () => {
    component.form.patchValue({ name: 'Statement', tag: 'General', channel: 'EMAIL', text: 'x'.repeat(500) });
    expect(component.isEmail).toBe(true);
    expect(component.fits).toBe(true);
    component.save();
    expect(saveTemplate).not.toHaveBeenCalled();
    component.form.controls.emailSubject.setValue('Your statement, {{client.name}}');
    component.save();
    expect(saveTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'EMAIL', emailSubject: 'Your statement, {{client.name}}' }),
      undefined
    );
  });

  it('puts a placeholder in the subject when the cursor was last there', () => {
    component.form.controls.channel.setValue('EMAIL');
    const body = document.createElement('textarea');
    const subject = document.createElement('input');
    component.form.controls.emailSubject.setValue('Hello ');
    subject.value = 'Hello ';
    subject.selectionStart = subject.selectionEnd = 6;
    component.focusOn('subject');
    component.insert({ key: 'client.name', label: '', group: '', example: '', maxLength: 20 }, body, subject);
    expect(component.form.controls.emailSubject.value).toBe('Hello {{client.name}}');
    expect(component.form.controls.text.value).toBe('');
  });

  it('wraps the selected email text in a tag', () => {
    const body = document.createElement('textarea');
    component.form.controls.text.setValue('Pay now');
    body.value = 'Pay now';
    body.selectionStart = 0;
    body.selectionEnd = 3;
    component.wrap('<b>', '</b>', body);
    expect(component.form.controls.text.value).toBe('<b>Pay</b> now');
  });
});
