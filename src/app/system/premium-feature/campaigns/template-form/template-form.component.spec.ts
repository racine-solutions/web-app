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
import { TEMPLATE_EXAMPLES } from './template-examples';
import { EMAIL_BLOCKS, EMAIL_FORMATS } from './email-blocks';

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

  it('every SMS example fits one SMS with the longest client details', () => {
    const longest: Record<string, number> = {
      'client.name': 20,
      'client.firstName': 20,
      'tenant.name': 20,
      'loans.nextDueAmount': 17,
      'loans.nextDueDate': 11,
      'loans.daysInArrears': 5,
      'loans.arrearsAmount': 17,
      'savings.totalBalance': 17
    };
    TEMPLATE_EXAMPLES.filter((example) => example.channel === 'SMS').forEach((example) => {
      const length = example.text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
        expect(longest[key]).toBeDefined();
        return 'x'.repeat(longest[key]);
      }).length;
      expect(length).toBeLessThanOrEqual(160);
    });
  });

  it('starts from an example, switching channel and filling the subject', () => {
    const example = TEMPLATE_EXAMPLES.find((candidate) => candidate.channel === 'EMAIL')!;
    component.useExample(example);
    expect(component.isEmail).toBe(true);
    expect(component.form.controls.emailSubject.value).toBe(example.emailSubject);
    expect(component.form.controls.text.value).toBe(example.text);
    expect(component.form.controls.name.value).toBe('');
    expect(component.nameHint).toBe(`e.g. ${example.name}`);
    expect(component.examples.every((candidate) => candidate.channel === 'EMAIL')).toBe(true);
  });

  it('asks before replacing a message already written', () => {
    component.form.controls.text.setValue('My own message');
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
    component.useExample(TEMPLATE_EXAMPLES[0]);
    expect(confirm).toHaveBeenCalled();
    expect(component.form.controls.text.value).toBe('My own message');
    confirm.mockRestore();
  });

  it('keeps a separate message for SMS and email when switching channel', () => {
    component.form.controls.text.setValue('Short SMS');
    component.form.controls.channel.setValue('EMAIL');
    expect(component.form.controls.text.value).toBe('');
    component.form.controls.text.setValue('A long email body');
    component.form.controls.channel.setValue('SMS');
    expect(component.form.controls.text.value).toBe('Short SMS');
    component.form.controls.channel.setValue('EMAIL');
    expect(component.form.controls.text.value).toBe('A long email body');
  });

  it('previews an email with its subject and keeps plain-text line breaks', () => {
    component.form.patchValue({ channel: 'EMAIL' });
    component.form.patchValue({ emailSubject: 'Update, {{client.name}}', text: 'Hi {{client.name}},\nA & B' });
    fixture.detectChanges();
    expect(component.shown.subject).toBe('Update, Mwesigye');
    expect(component.shown.message).toBe('Hi Mwesigye,<br>\nA &amp; B');
    expect(fixture.nativeElement.querySelector('.email-subject').textContent).toContain('Update, Mwesigye');
    expect(fixture.nativeElement.querySelector('iframe')).not.toBeNull();
  });

  it('the SMS preview never shows the email', () => {
    component.form.patchValue({ channel: 'EMAIL' });
    component.form.patchValue({ text: '<p>Hi {{client.name}}</p>' });
    component.form.controls.channel.setValue('SMS');
    component.form.controls.text.setValue('Hi {{client.name}}, pay {{loans.nextDueAmount}}.');
    fixture.detectChanges();
    const bubble = fixture.nativeElement.querySelector('.bubble').textContent;
    expect(bubble).toContain('Hi Mwesigye, pay UGX 85,000.');
    expect(bubble).not.toContain('<p>');
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
  });

  it('turns each selected line into a list item', () => {
    const body = document.createElement('textarea');
    component.form.controls.text.setValue('Pay on time\nSave weekly');
    body.value = component.form.controls.text.value!;
    body.selectionStart = 0;
    body.selectionEnd = body.value.length;
    component.applyFormat(EMAIL_FORMATS.find((format) => format.label === '• List')!, body);
    expect(component.form.controls.text.value).toBe('<ul>\n  <li>Pay on time</li>\n  <li>Save weekly</li>\n</ul>');
  });

  it('inserts a ready-made block at the cursor', () => {
    const body = document.createElement('textarea');
    component.form.controls.text.setValue('Hi\n');
    body.value = 'Hi\n';
    body.selectionStart = body.selectionEnd = 3;
    component.insertBlock(EMAIL_BLOCKS.find((block) => block.label === 'Details table')!, body);
    expect(component.form.controls.text.value).toContain('Hi\n<table');
    expect(component.form.controls.text.value).toContain('{{loans.totalOutstanding}}');
  });

  it('every block and format only uses placeholders the catalogue knows', () => {
    const known = [
      'client.office',
      'client.loanOfficer',
      'tenant.name',
      'loans.totalOutstanding',
      'loans.nextDueAmount',
      'loans.nextDueDate',
      'savings.totalBalance'
    ];
    EMAIL_BLOCKS.forEach((block) =>
      (block.html.match(/\{\{\s*([\w.]+)\s*\}\}/g) || []).forEach((tag) =>
        expect(known).toContain(tag.replace(/[{}\s]/g, ''))
      )
    );
  });
});
