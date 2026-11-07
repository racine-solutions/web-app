/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatStep, MatStepper, MatStepperNext, MatStepperPrevious } from '@angular/material/stepper';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { SKIP_GLOBAL_ERROR_HANDLER } from 'app/core/http/error-handler.interceptor';

import { AudienceCount, AudienceFilter, CommTemplate, MessageCheck } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';
import { emailDays, emailDocument } from '../email-preview';
import { AudienceEditorComponent, AudienceState } from '../audience-editor/audience-editor.component';
import { RepeatStop, RepeatUnit, Schedule, ScheduleType, describe, upcoming } from '../schedule';

/** Create or edit a campaign in four steps: template, audience, schedule, review. It is then submitted for approval. */
@Component({
  selector: 'mifosx-campaign-form',
  templateUrl: './campaign-form.component.html',
  styleUrls: [
    '../campaigns.scss',
    './campaign-form.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FormsModule,
    MatIcon,
    MatStepper,
    MatStep,
    MatStepperNext,
    MatStepperPrevious,
    MatRadioGroup,
    MatRadioButton,
    MatCheckbox,
    AudienceEditorComponent
  ]
})
export class CampaignFormComponent implements OnInit {
  private service = inject(CampaignsService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  /** A saved audience to start the campaign with (from Saved audiences, "Use in campaign"). */
  startAudienceId: number | null = null;
  /** The campaign's filters when editing, handed to the audience editor once. */
  initialFilters: AudienceFilter[] | null = null;
  /** The audience as the editor last reported it. */
  audienceFilters: AudienceFilter[] = [];
  audienceLines: string[] = [];

  campaignId?: number;
  name = new FormControl('', [
    Validators.required,
    Validators.maxLength(150)
  ]);
  templateId: number | null = null;
  templates: CommTemplate[] = [];
  scheduleType: ScheduleType = 'NOW';
  sendDate = '';
  sendTime = '09:00';
  repeatEvery = 1;
  repeatUnit: RepeatUnit = 'MONTHS';
  repeatStop: RepeatStop = 'NEVER';
  repeatUntil = '';
  repeatMaxRuns = 6;
  quietHours = false;
  quietFrom = '08:00';
  quietTo = '20:00';

  preview: MessageCheck | null = null;
  /** Email templates: the preview page for a sandboxed frame. */
  previewHtml: SafeHtml | null = null;
  emailEnabled = true;
  emailDailyLimit: number | null = null;
  emailsLeftToday: number | null = null;
  count: AudienceCount | null = null;

  smsCost: number | null = null;
  smsBalance: number | null = null;
  saving = false;

  ngOnInit() {
    this.campaignId = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.startAudienceId = this.campaignId ? null : Number(this.route.snapshot.queryParamMap?.get('audience')) || null;
    this.service.getTemplates(false, 0, 500).subscribe((page) => {
      this.templates = page.pageItems;
      this.changeDetector.markForCheck();
    });
    this.http
      .get<any>('/sms/account/status', { context: new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLER, true) })
      .pipe(catchError(() => of(null)))
      .subscribe((status) => {
        this.smsCost = status?.smsCost ?? null;
        this.smsBalance = status?.smsBalance ?? null;
        this.changeDetector.markForCheck();
      });
    this.service.getCampaignDefaults().subscribe((defaults) => {
      if (!this.campaignId) {
        this.quietHours = !!defaults.quietFrom;
        this.quietFrom = defaults.quietFrom || this.quietFrom;
        this.quietTo = defaults.quietTo || this.quietTo;
      }
      this.emailEnabled = defaults.emailEnabled !== false;
      this.emailDailyLimit = defaults.emailDailyLimit ?? null;
      this.emailsLeftToday = defaults.emailsLeftToday ?? null;
      this.changeDetector.markForCheck();
    });
    if (this.campaignId) {
      this.service.getCampaign(this.campaignId).subscribe((campaign) => {
        this.name.setValue(campaign.name);
        this.templateId = campaign.templateId;
        this.initialFilters = JSON.parse(campaign.audience || '[]') as AudienceFilter[];
        this.scheduleType = campaign.scheduleType;
        this.repeatEvery = campaign.repeatEvery || 1;
        this.repeatUnit = campaign.repeatUnit || 'MONTHS';
        this.repeatStop = campaign.repeatStop || 'NEVER';
        this.repeatUntil = campaign.repeatUntil || '';
        this.repeatMaxRuns = campaign.repeatMaxRuns || 6;
        this.quietHours = !!campaign.quietFrom;
        this.quietFrom = campaign.quietFrom || this.quietFrom;
        this.quietTo = campaign.quietTo || this.quietTo;
        if (campaign.scheduledAt) {
          [
            this.sendDate,
            this.sendTime
          ] = campaign.scheduledAt.split(' ');
        }
        this.templateChanged();
        this.changeDetector.markForCheck();
      });
    }
  }

  get template(): CommTemplate | undefined {
    return this.templates.find((template) => template.id === this.templateId);
  }

  get purpose(): string {
    return this.template?.purpose || 'GENERAL';
  }

  get channel(): 'SMS' | 'EMAIL' {
    return this.template?.channel || 'SMS';
  }

  get isEmail(): boolean {
    return this.channel === 'EMAIL';
  }

  templateChanged() {
    this.preview = null;
    this.previewHtml = null;
    if (this.templateId) {
      this.service.preview({ templateId: this.templateId }).subscribe((preview) => {
        this.preview = preview;
        this.previewHtml = this.isEmail ? this.sanitizer.bypassSecurityTrustHtml(emailDocument(preview.message)) : null;
        this.changeDetector.markForCheck();
      });
    }
  }

  /** Days one run takes under the daily email limit. */
  get emailRunDays(): number {
    return emailDays(this.count?.recipients ?? 0, this.emailDailyLimit, this.emailsLeftToday);
  }

  /** True when the chosen audience is staff, not clients. */
  audienceIsStaff = false;

  /** Tags in the template that don't suit the audience, e.g. a loan balance in a message to staff. */
  get unsuitableTags(): string[] {
    const text = `${this.template?.text || ''} ${this.template?.emailSubject || ''}`;
    const clientGroups = [
      'client',
      'loans',
      'savings',
      'fixedDeposit',
      'recurringDeposit',
      'shares'
    ];
    const tags = Array.from(text.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g), (match) => match[1]);
    return Array.from(
      new Set(
        tags.filter((tag) => {
          const group = tag.split('.')[0];
          return this.audienceIsStaff ? clientGroups.includes(group) : group === 'staff';
        })
      )
    );
  }

  /** The audience editor reports its filters, count and summary after every change. */
  audienceChanged(state: AudienceState) {
    this.audienceIsStaff = state.audienceType === 'STAFF';
    this.audienceFilters = state.filters;
    this.count = state.count;
    this.audienceLines = state.summary;
    this.changeDetector.markForCheck();
  }

  get cost(): number | null {
    return this.count && this.smsCost !== null ? this.count.recipients * this.smsCost : null;
  }

  get scheduledAt(): string | null {
    return this.scheduleType !== 'NOW' && this.sendDate && this.sendTime ? `${this.sendDate} ${this.sendTime}` : null;
  }

  get schedule(): Schedule {
    return {
      scheduleType: this.scheduleType,
      scheduledAt: this.scheduledAt,
      repeatEvery: this.scheduleType === 'REPEAT' ? this.repeatEvery : null,
      repeatUnit: this.scheduleType === 'REPEAT' ? this.repeatUnit : null,
      repeatStop: this.scheduleType === 'REPEAT' ? this.repeatStop : null,
      repeatUntil: this.scheduleType === 'REPEAT' && this.repeatStop === 'ON_DATE' ? this.repeatUntil : null,
      repeatMaxRuns: this.scheduleType === 'REPEAT' && this.repeatStop === 'AFTER_RUNS' ? this.repeatMaxRuns : null,
      quietFrom: this.quietHours ? this.quietFrom : null,
      quietTo: this.quietHours ? this.quietTo : null
    };
  }

  /** What's wrong with the schedule, or '' when it is fine. */
  get scheduleProblem(): string {
    if (this.quietHours && (!this.quietFrom || !this.quietTo || this.quietFrom >= this.quietTo)) {
      return 'Quiet hours need a start before the end, e.g. 08:00 to 20:00.';
    }
    if (this.scheduleType === 'NOW') {
      return '';
    }
    const at = this.scheduledAt;
    if (!at || new Date(at.replace(' ', 'T')) <= new Date()) {
      return 'Choose a first send date and time in the future.';
    }
    if (this.scheduleType === 'REPEAT') {
      if (!(this.repeatEvery >= 1 && this.repeatEvery <= 365)) {
        return 'Repeat every 1 to 365 days, weeks or months.';
      }
      if (this.repeatStop === 'ON_DATE' && (!this.repeatUntil || this.repeatUntil < this.sendDate)) {
        return 'Choose a last date on or after the first send.';
      }
      if (this.repeatStop === 'AFTER_RUNS' && !(this.repeatMaxRuns >= 1 && this.repeatMaxRuns <= 1000)) {
        return 'Stop after 1 to 1000 runs.';
      }
    }
    return '';
  }

  get scheduleValid(): boolean {
    return !this.scheduleProblem;
  }

  get upcomingRuns(): Date[] {
    return this.scheduleValid ? upcoming(this.schedule, 6) : [];
  }

  get scheduleText(): string {
    return describe(this.schedule);
  }

  /** Runs the wallet covers, at today's audience size. */
  get runsCovered(): number | null {
    if (this.smsBalance === null || !this.count?.recipients) {
      return null;
    }
    return Math.floor(this.smsBalance / this.count.recipients);
  }

  save(submit: boolean) {
    if (this.name.invalid || !this.templateId || !this.audienceFilters.length || !this.scheduleValid) {
      this.name.markAsTouched();
      return;
    }
    this.saving = true;
    const body = {
      name: this.name.value,
      templateId: this.templateId,
      audience: this.audienceFilters,
      ...this.schedule
    };
    this.service.saveCampaign(body, this.campaignId).subscribe({
      next: (result) => {
        const id = this.campaignId || result.resourceId;
        const done = () =>
          this.router.navigate([
            '/system',
            'premium-feature',
            'campaigns',
            id
          ]);
        if (submit) {
          this.service.act(id, 'submit').subscribe({ next: done, error: done });
        } else {
          done();
        }
      },
      error: () => {
        this.saving = false;
        this.changeDetector.markForCheck();
      }
    });
  }
}
