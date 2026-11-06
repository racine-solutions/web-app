/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpContext } from '@angular/common/http';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatStep, MatStepper, MatStepperNext, MatStepperPrevious } from '@angular/material/stepper';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { Subject, debounceTime, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { SearchService } from 'app/search/search.service';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { SKIP_GLOBAL_ERROR_HANDLER } from 'app/core/http/error-handler.interceptor';

import {
  AudienceCount,
  AudienceFilter,
  AudienceOptions,
  CommTemplate,
  MessageCheck,
  reasonLabel
} from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';
import { FIELD_SPECS, FieldSpec, QUICK_PICKS, optionsFor } from './audience-fields';
import {
  AudienceClientsDialogComponent,
  AudienceClientsDialogData
} from '../audience-clients-dialog/audience-clients-dialog.component';

interface FilterRow extends AudienceFilter {
  operator: string;
}

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
    MatAutocomplete,
    MatAutocompleteTrigger
  ]
})
export class CampaignFormComponent implements OnInit {
  private service = inject(CampaignsService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private searchService = inject(SearchService);

  readonly specs = FIELD_SPECS;
  readonly quickPicks = QUICK_PICKS;
  readonly reasonLabel = reasonLabel;

  campaignId?: number;
  name = new FormControl('', [
    Validators.required,
    Validators.maxLength(150)
  ]);
  templateId: number | null = null;
  templates: CommTemplate[] = [];
  options: AudienceOptions | null = null;
  filters: FilterRow[] = [];
  scheduleType: 'NOW' | 'ONCE' = 'NOW';
  sendDate = '';
  sendTime = '09:00';

  preview: MessageCheck | null = null;
  count: AudienceCount | null = null;
  counting = false;
  smsCost: number | null = null;
  smsBalance: number | null = null;
  saving = false;

  /** Names of clients picked in a "Specific clients" filter, by id. */
  clientNames: Record<string, string> = {};
  clientMatches: any[] = [];
  private clientQueries = new Subject<string>();

  private countRequests = new Subject<void>();

  ngOnInit() {
    this.campaignId = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.service.getTemplates(false, 0, 500).subscribe((page) => {
      this.templates = page.pageItems.filter((template) => template.channel === 'SMS');
      this.changeDetector.markForCheck();
    });
    this.service.getAudienceOptions().subscribe((options) => {
      this.options = options;
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
    this.countRequests
      .pipe(
        debounceTime(400),
        switchMap(() => {
          this.counting = true;
          this.changeDetector.markForCheck();
          return this.service.countAudience(this.cleanFilters(), this.purpose).pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((count) => {
        this.count = count;
        this.counting = false;
        this.changeDetector.markForCheck();
      });
    this.clientQueries
      .pipe(
        debounceTime(300),
        switchMap((query) =>
          query.trim().length < 2
            ? of([])
            : this.searchService.getSearchResults(query.trim(), 'clients').pipe(catchError(() => of([])))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((results: any) => {
        this.clientMatches = (results || []).slice(0, 10);
        this.changeDetector.markForCheck();
      });
    if (this.campaignId) {
      this.service.getCampaign(this.campaignId).subscribe((campaign) => {
        this.name.setValue(campaign.name);
        this.templateId = campaign.templateId;
        this.filters = (JSON.parse(campaign.audience || '[]') as AudienceFilter[]).map((filter) => ({
          ...filter,
          operator: filter.operator || 'IN',
          values: filter.values || []
        }));
        this.scheduleType = campaign.scheduleType;
        if (campaign.scheduledAt) {
          [
            this.sendDate,
            this.sendTime
          ] = campaign.scheduledAt.split(' ');
        }
        this.templateChanged();
        this.recount();
      });
    } else {
      this.recount();
    }
  }

  get template(): CommTemplate | undefined {
    return this.templates.find((template) => template.id === this.templateId);
  }

  get purpose(): string {
    return this.template?.purpose || 'GENERAL';
  }

  templateChanged() {
    this.preview = null;
    if (this.templateId) {
      this.service.preview({ templateId: this.templateId }).subscribe((preview) => {
        this.preview = preview;
        this.changeDetector.markForCheck();
      });
    }
    this.recount();
  }

  spec(field: string): FieldSpec {
    return this.specs[field] || { kind: 'number' };
  }

  choices(field: string) {
    return optionsFor(this.spec(field), this.options);
  }

  addFilter(filter?: { field: string; operator?: string; values: string[] }) {
    const field = filter?.field || 'GENDER';
    this.filters = [
      ...this.filters,
      {
        field,
        operator: filter?.operator || 'IN',
        values: filter?.values ? [...filter.values] : [],
        includeChildren: true
      }
    ];
    this.recount();
  }

  fieldChanged(row: FilterRow) {
    row.values = [];
    row.operator = 'IN';
    this.recount();
  }

  removeFilter(index: number) {
    this.filters = this.filters.filter((_, i) => i !== index);
    this.recount();
  }

  setValue(row: FilterRow, index: number, value: string | number | null) {
    const values = [...row.values];
    values[index] = value === null || value === undefined ? '' : String(value);
    row.values = values;
    this.recount();
  }

  searchClients(query: string) {
    this.clientQueries.next(query || '');
  }

  addClient(row: FilterRow, client: any, input: HTMLInputElement) {
    const id = String(client.entityId);
    this.clientNames[id] = `${client.entityName} · ${client.entityAccountNo}`;
    if (!row.values.includes(id)) {
      row.values = [
        ...row.values,
        id
      ];
    }
    input.value = '';
    this.clientMatches = [];
    this.recount();
  }

  removeClient(row: FilterRow, id: string) {
    row.values = row.values.filter((value) => value !== id);
    this.recount();
  }

  clientLabel(id: string): string {
    return this.clientNames[id] || `Client #${id}`;
  }

  recount() {
    this.changeDetector.markForCheck();
    this.countRequests.next();
  }

  /** Opens every matching client in a paged list; closing it comes back here unchanged. */
  showClients() {
    if (!this.count?.matching) {
      return;
    }
    this.dialog.open(AudienceClientsDialogComponent, {
      width: '960px',
      maxWidth: '95vw',
      data: { audience: this.cleanFilters(), purpose: this.purpose, count: this.count } as AudienceClientsDialogData
    });
  }

  get skippedReasons(): { reason: string; count: number }[] {
    return Object.entries(this.count?.skipped || {}).map(
      ([
        reason,
        count
      ]) => ({ reason, count })
    );
  }

  get cost(): number | null {
    return this.count && this.smsCost !== null ? this.count.recipients * this.smsCost : null;
  }

  get scheduledAt(): string | null {
    return this.scheduleType === 'ONCE' && this.sendDate && this.sendTime ? `${this.sendDate} ${this.sendTime}` : null;
  }

  get scheduleValid(): boolean {
    if (this.scheduleType === 'NOW') {
      return true;
    }
    const at = this.scheduledAt;
    return !!at && new Date(at.replace(' ', 'T')) > new Date();
  }

  audienceSummary(row: FilterRow): string {
    const label = this.options?.fields.find((field) => field.field === row.field)?.label || row.field;
    const spec = this.spec(row.field);
    if (spec.kind === 'options' || spec.kind === 'choice') {
      const names = this.choices(row.field)
        .filter((choice) => row.values.includes(choice.value))
        .map((choice) => choice.label);
      return `${label} ${row.operator === 'NOT_IN' ? 'is none of' : 'is'} ${names.join(', ') || '—'}`;
    }
    if (spec.kind === 'clients') {
      return `${row.operator === 'NOT_IN' ? 'Leave out' : 'Only'} ${row.values.map((id) => this.clientLabel(id)).join(', ') || '—'}`;
    }
    if (spec.kind === 'range') {
      return `${label} ${row.values[0] || 'any'} – ${row.values[1] || 'any'} ${spec.unit || ''}`;
    }
    return `${label} ${row.values[0] || '—'} ${spec.unit || ''}`;
  }

  save(submit: boolean) {
    if (this.name.invalid || !this.templateId || !this.scheduleValid) {
      this.name.markAsTouched();
      return;
    }
    this.saving = true;
    const body = {
      name: this.name.value,
      templateId: this.templateId,
      audience: this.cleanFilters(),
      scheduleType: this.scheduleType,
      scheduledAt: this.scheduledAt
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

  /** Rows with a value only: an empty row added by mistake doesn't block the count. */
  private cleanFilters(): AudienceFilter[] {
    return this.filters
      .filter((row) => row.values.some((value) => value !== '' && value !== null && value !== undefined))
      .map((row) => ({
        field: row.field,
        operator: row.operator,
        values: row.values,
        includeChildren: row.field === 'OFFICE' ? !!row.includeChildren : undefined
      }));
  }
}
