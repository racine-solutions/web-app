/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, debounceTime, merge, of, switchMap } from 'rxjs';
import { catchError, distinctUntilChanged, filter } from 'rxjs/operators';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { SearchService } from 'app/search/search.service';

import { MessageCheck, Placeholder } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';
import { emailDocument } from '../email-preview';

/** Characters of the standard SMS alphabet; anything else makes the SMS Unicode (70 characters). */
const GSM_7 =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà^{}\\[~]|€';

/**
 * Create or edit a communication template: an SMS with the one-SMS check, or an email with a subject and an HTML body.
 * Placeholder buttons and a live preview for both.
 */
@Component({
  selector: 'mifosx-comm-template-form',
  templateUrl: './template-form.component.html',
  styleUrls: [
    '../campaigns.scss',
    './template-form.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatButtonToggleGroup,
    MatButtonToggle
  ]
})
export class TemplateFormComponent implements OnInit {
  private service = inject(CampaignsService);
  private searchService = inject(SearchService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

  form = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.maxLength(200)
    ]),
    tag: new FormControl('General', [
      Validators.required,
      Validators.maxLength(50)
    ]),
    purpose: new FormControl<'GENERAL' | 'MARKETING'>('GENERAL', Validators.required),
    channel: new FormControl<'SMS' | 'EMAIL'>('SMS', Validators.required),
    emailSubject: new FormControl('', Validators.maxLength(200)),
    text: new FormControl('', Validators.required)
  });
  clientSearch = new FormControl('');

  templateId?: number;
  placeholders: Placeholder[] = [];
  groups: { name: string; items: Placeholder[] }[] = [];
  tags: string[] = [];
  clients: any[] = [];
  previewClient: { id: number; name: string } | null = null;
  preview: MessageCheck | null = null;
  /** The email preview, shown in a sandboxed frame that can't run scripts or reach the app. */
  previewHtml: SafeHtml | null = null;
  saving = false;
  emailEnabled = true;
  /** Where a placeholder button inserts: the subject or the message body. */
  private target: 'subject' | 'text' = 'text';

  private previewRequests = new Subject<void>();

  ngOnInit() {
    this.templateId = Number(this.route.snapshot.paramMap.get('templateId')) || undefined;
    this.service.getPlaceholders().subscribe((placeholders) => {
      this.placeholders = placeholders;
      const byGroup = new Map<string, Placeholder[]>();
      placeholders.forEach((placeholder) =>
        byGroup.set(placeholder.group, [
          ...(byGroup.get(placeholder.group) || []),
          placeholder
        ])
      );
      this.groups = Array.from(
        byGroup,
        ([
          name,
          items
        ]) => ({ name, items })
      );
      this.changeDetector.markForCheck();
    });
    this.service.getTags().subscribe((tags) => {
      this.tags = tags;
      this.changeDetector.markForCheck();
    });
    this.service.getCampaignDefaults().subscribe((defaults) => {
      this.emailEnabled = defaults.emailEnabled !== false;
      this.changeDetector.markForCheck();
    });
    if (this.templateId) {
      this.service.getTemplate(this.templateId).subscribe((template) => {
        this.form.patchValue(template);
        this.requestPreview();
      });
    }
    merge(
      this.form.controls.text.valueChanges,
      this.form.controls.emailSubject.valueChanges,
      this.form.controls.channel.valueChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.requestPreview());
    this.form.controls.channel.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((channel) => {
      const subject = this.form.controls.emailSubject;
      subject.setValidators(
        channel === 'EMAIL' ? [
              Validators.required,
              Validators.maxLength(200)
            ] : Validators.maxLength(200)
      );
      subject.updateValueAndValidity({ emitEvent: false });
      this.target = 'text';
    });
    this.previewRequests
      .pipe(
        debounceTime(300),
        switchMap(() =>
          this.service
            .preview({
              text: this.form.controls.text.value || '',
              clientId: this.previewClient?.id,
              channel: this.form.controls.channel.value || 'SMS',
              emailSubject: this.form.controls.emailSubject.value || ''
            })
            .pipe(catchError(() => of(null)))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((preview) => {
        this.preview = preview;
        this.previewHtml =
          preview && this.isEmail ? this.sanitizer.bypassSecurityTrustHtml(emailDocument(preview.message)) : null;
        this.changeDetector.markForCheck();
      });
    this.clientSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((query) => typeof query === 'string' && query.trim().length >= 2),
        switchMap((query) =>
          this.searchService.getSearchResults(query.trim(), 'clients').pipe(catchError(() => of([])))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((results: any) => {
        this.clients = (results || []).slice(0, 10);
        this.changeDetector.markForCheck();
      });
    this.requestPreview();
  }

  get isEmail(): boolean {
    return this.form.controls.channel.value === 'EMAIL';
  }

  /** Remembers the field the cursor was last in, so placeholders go into the subject or the body. */
  focusOn(target: 'subject' | 'text') {
    this.target = target;
  }

  insert(placeholder: Placeholder, body: HTMLTextAreaElement, subject?: HTMLInputElement) {
    const field = this.isEmail && this.target === 'subject' && subject ? subject : body;
    this.insertText(`{{${placeholder.key}}}`, field, this.isEmail && field === subject ? 'emailSubject' : 'text');
  }

  /** Wraps the selected text of the email body in a tag, e.g. <b>…</b>. */
  wrap(open: string, close: string, body: HTMLTextAreaElement) {
    const value = this.form.controls.text.value || '';
    const start = body.selectionStart ?? value.length;
    const end = body.selectionEnd ?? value.length;
    this.form.controls.text.setValue(value.slice(0, start) + open + value.slice(start, end) + close + value.slice(end));
    setTimeout(() => {
      body.focus();
      body.selectionStart = start + open.length;
      body.selectionEnd = end + open.length;
    });
  }

  private insertText(token: string, field: HTMLTextAreaElement | HTMLInputElement, control: 'text' | 'emailSubject') {
    const value = this.form.controls[control].value || '';
    const start = field.selectionStart ?? value.length;
    const end = field.selectionEnd ?? value.length;
    this.form.controls[control].setValue(value.slice(0, start) + token + value.slice(end));
    setTimeout(() => {
      field.focus();
      field.selectionStart = field.selectionEnd = start + token.length;
    });
  }

  pickClient(client: any) {
    this.previewClient = { id: client.entityId, name: `${client.entityName} · ${client.entityAccountNo}` };
    this.clientSearch.setValue('', { emitEvent: false });
    this.clients = [];
    this.requestPreview();
  }

  clearClient() {
    this.previewClient = null;
    this.requestPreview();
  }

  /** Worked out here as the user types, so the counter never waits for the server. */
  get typedLength(): number {
    return this.preview?.length ?? (this.form.controls.text.value || '').length;
  }

  get longestLength(): number {
    const text = this.form.controls.text.value || '';
    return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
      const placeholder = this.placeholders.find((p) => p.key === key);
      return placeholder ? 'x'.repeat(placeholder.maxLength) : match;
    }).length;
  }

  get limit(): number {
    const text = (this.form.controls.text.value || '') + (this.preview?.message || '');
    return [...text].some((ch) => !GSM_7.includes(ch)) ? 70 : 160;
  }

  get fits(): boolean {
    return this.isEmail || this.longestLength <= this.limit;
  }

  save() {
    if (this.form.invalid || !this.fits) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const template = this.form.getRawValue();
    this.service
      .saveTemplate({ ...template, emailSubject: this.isEmail ? template.emailSubject : null } as any, this.templateId)
      .subscribe({
        next: () =>
          this.router.navigate([
            '/system',
            'premium-feature',
            'campaigns',
            'templates'
          ]),
        error: () => {
          this.saving = false;
          this.changeDetector.markForCheck();
        }
      });
  }

  private requestPreview() {
    this.previewRequests.next();
  }
}
