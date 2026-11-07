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
import { MatIcon } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, debounceTime, merge, of, switchMap } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { SearchService } from 'app/search/search.service';

import { MessageCheck, Placeholder } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';
import { asEmailHtml, emailDocument, escapeHtml } from '../email-preview';
import { EMAIL_HINT, SMS_HINT, SUBJECT_HINT, TEMPLATE_EXAMPLES, TemplateExample } from './template-examples';

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
    MatButtonToggle,
    MatIcon
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
  /** The server's preview for the chosen client, and the channel it was made for. */
  preview: MessageCheck | null = null;
  private previewChannel: 'SMS' | 'EMAIL' | null = null;
  /** The email page last handed to the preview frame, kept so the frame only reloads when the email changes. */
  private shownDocument = '';
  private shownHtml: SafeHtml | null = null;
  saving = false;
  emailEnabled = true;
  readonly subjectHint = SUBJECT_HINT;
  /** Suggested name, shown faded in the empty Name box; the user types their own. */
  nameHint = 'e.g. Repayment reminder';
  /** The message written for each channel, so switching channel never judges an email as an SMS. */
  private drafts: Partial<Record<'SMS' | 'EMAIL', string>> = {};
  private channelNow: 'SMS' | 'EMAIL' = 'SMS';
  /** True while the form is filled in by code (loading, examples), when channel changes keep the text. */
  private applying = false;
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
        this.applying = true;
        this.form.patchValue(template);
        this.applying = false;
        this.channelNow = template.channel;
        this.changeDetector.markForCheck();
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
      if (!this.applying && channel && channel !== this.channelNow) {
        // Keep what was written for the other channel and bring back this channel's own message
        this.drafts[this.channelNow] = this.form.controls.text.value || '';
        this.form.controls.text.setValue(this.drafts[channel] || '');
      }
      this.channelNow = channel || 'SMS';
      this.changeDetector.markForCheck();
    });
    this.previewRequests
      .pipe(
        debounceTime(300),
        switchMap(() => {
          // Example values are filled in here as the user types; the server is asked only for a real client
          if (!this.previewClient) {
            return of(null);
          }
          const channel = this.form.controls.channel.value || 'SMS';
          return this.service
            .preview({
              text: this.form.controls.text.value || '',
              clientId: this.previewClient.id,
              channel,
              emailSubject: this.form.controls.emailSubject.value || ''
            })
            .pipe(
              map((preview) => ({ preview, channel })),
              catchError(() => of(null))
            );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((result) => {
        this.preview = result?.preview ?? null;
        this.previewChannel = result?.channel ?? null;
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

  /** Examples for the chosen channel. */
  get examples(): TemplateExample[] {
    return TEMPLATE_EXAMPLES.filter((example) => example.channel === (this.isEmail ? 'EMAIL' : 'SMS'));
  }

  get bodyHint(): string {
    return this.isEmail ? EMAIL_HINT : SMS_HINT;
  }

  /** Fills the form with an example to change; asks first when a message is already written. */
  useExample(example: TemplateExample) {
    const written = (this.form.controls.text.value || '').trim();
    if (written && written !== example.text && !window.confirm('Replace your message with this example?')) {
      return;
    }
    this.applying = true;
    this.form.patchValue({
      channel: example.channel,
      text: example.text,
      emailSubject: example.emailSubject || '',
      purpose: example.purpose,
      tag:
        this.form.controls.tag.value && this.form.controls.tag.value !== 'General'
          ? this.form.controls.tag.value
          : example.tag
    });
    this.nameHint = `e.g. ${example.name}`;
    this.applying = false;
    this.channelNow = example.channel;
    this.changeDetector.markForCheck();
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
  /**
   * What the preview shows: the chosen client's message from the server when it is for this channel, else the
   * message filled in here with example values, so the preview always follows what is typed and the channel picked.
   */
  get shown(): { message: string; subject: string } {
    const channel = this.isEmail ? 'EMAIL' : 'SMS';
    if (this.previewClient && this.preview && this.previewChannel === channel) {
      return { message: this.preview.message || '', subject: this.preview.subject || '' };
    }
    const text = this.form.controls.text.value || '';
    return {
      message: this.isEmail ? this.fill(asEmailHtml(text), true) : this.fill(text, false).trim(),
      subject: this.isEmail ? this.fill(this.form.controls.emailSubject.value || '', false) : ''
    };
  }

  /** The email page for the sandboxed preview frame; the same object while the email is unchanged. */
  get emailHtml(): SafeHtml | null {
    const page = emailDocument(this.shown.message);
    if (page !== this.shownDocument) {
      this.shownDocument = page;
      this.shownHtml = this.sanitizer.bypassSecurityTrustHtml(page);
    }
    return this.shownHtml;
  }

  /** Puts each placeholder's example value in place, escaped for HTML when the message is an email. */
  private fill(text: string, html: boolean): string {
    return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
      const placeholder = this.placeholders.find((p) => p.key === key);
      if (!placeholder) {
        return match;
      }
      return html ? escapeHtml(placeholder.example) : placeholder.example;
    });
  }

  get typedLength(): number {
    return this.shown.message.length;
  }

  get longestLength(): number {
    const text = this.form.controls.text.value || '';
    return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
      const placeholder = this.placeholders.find((p) => p.key === key);
      return placeholder ? 'x'.repeat(placeholder.maxLength) : match;
    }).length;
  }

  get limit(): number {
    const text = (this.form.controls.text.value || '') + this.shown.message;
    return [...text].some((ch) => !GSM_7.includes(ch)) ? 70 : 160;
  }

  /** True when the email body is HTML rather than plain text. */
  get hasHtml(): boolean {
    return /<\/?[a-zA-Z][^>]*>/.test(this.form.controls.text.value || '');
  }

  /** SMS parts the longest message needs; more than one is never allowed. */
  get smsParts(): number {
    return Math.max(1, Math.ceil(this.longestLength / this.limit));
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
