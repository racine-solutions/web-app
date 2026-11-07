/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Subject, debounceTime, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { SearchService } from 'app/search/search.service';

import { AudienceCount, AudienceFilter, AudienceOptions, SavedAudience, reasonLabel } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';
import { FIELD_SPECS, FieldSpec, QUICK_PICKS, optionsFor } from '../campaign-form/audience-fields';
import {
  AudienceClientsDialogComponent,
  AudienceClientsDialogData
} from '../audience-clients-dialog/audience-clients-dialog.component';

interface FilterRow extends AudienceFilter {
  operator: string;
}

/** What the editor reports after every change. */
export interface AudienceState {
  /** Filters with a value, ready to save or send. */
  filters: AudienceFilter[];
  count: AudienceCount | null;
  counting: boolean;
  /** One readable line per filter, e.g. "Gender is Female". */
  summary: string[];
}

/**
 * Builds an audience: filters, quick picks, a live count of who matches and who is skipped, and the paged list of
 * matching clients. Used by the campaign wizard's Audience step and by the standalone audience page.
 */
@Component({
  selector: 'mifosx-audience-editor',
  templateUrl: './audience-editor.component.html',
  styleUrls: [
    '../campaigns.scss',
    './audience-editor.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FormsModule,
    MatIcon,
    MatCheckbox,
    MatAutocomplete,
    MatAutocompleteTrigger
  ]
})
export class AudienceEditorComponent implements OnInit, OnChanges {
  private service = inject(CampaignsService);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private searchService = inject(SearchService);

  /** GENERAL or MARKETING: marketing skips clients who opted out. */
  @Input() purpose = 'GENERAL';
  /** SMS or EMAIL: decides whose phone or email is checked. */
  @Input() channel: 'SMS' | 'EMAIL' = 'SMS';
  /** Filters to start with, e.g. a campaign or saved audience being edited. */
  @Input() initialFilters: AudienceFilter[] | null = null;
  /** A saved audience to load once the list arrives. */
  @Input() startAudienceId: number | null = null;
  @Input() showSavedPicker = true;
  @Input() showSave = true;
  /** Pick a saved audience and see it, without changing its filters (campaign wizard). */
  @Input() readOnly = false;
  @Output() changed = new EventEmitter<AudienceState>();

  readonly specs = FIELD_SPECS;
  readonly quickPicks = QUICK_PICKS;
  readonly reasonLabel = reasonLabel;

  options: AudienceOptions | null = null;
  filters: FilterRow[] = [];
  count: AudienceCount | null = null;
  counting = false;

  savedAudiences: SavedAudience[] = [];
  savedAudienceId: number | null = null;
  audienceName = '';
  /** Suggested name, shown faded in the empty "Save these filters as" box; the user types their own. */
  audienceNameHint = 'e.g. Women 18–35 with savings';
  savingAudience = false;
  audienceMessage = '';

  /** Names of clients picked in a "Specific clients" filter, by id. */
  clientNames: Record<string, string> = {};
  clientMatches: any[] = [];
  private clientQueries = new Subject<string>();
  private countRequests = new Subject<void>();

  ngOnInit() {
    this.service.getAudienceOptions().subscribe((options) => {
      this.options = options;
      this.emit();
      this.changeDetector.markForCheck();
    });
    this.countRequests
      .pipe(
        debounceTime(400),
        switchMap(() => {
          this.counting = true;
          this.emit();
          this.changeDetector.markForCheck();
          return this.service
            .countAudience(this.cleanFilters(), this.purpose, this.channel)
            .pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((count) => {
        this.count = count;
        this.counting = false;
        this.emit();
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
    if (this.showSavedPicker || this.showSave || this.startAudienceId) {
      this.loadSavedAudiences();
    }
    this.recount();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialFilters'] && this.initialFilters) {
      this.filters = this.toRows(this.initialFilters);
    }
    if (changes['initialFilters'] || changes['purpose'] || changes['channel']) {
      this.recount();
    }
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
    if (this.readOnly && !this.filters.length) {
      this.count = null;
      this.emit();
      this.changeDetector.markForCheck();
      return;
    }
    this.emit();
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
      data: {
        audience: this.cleanFilters(),
        purpose: this.purpose,
        channel: this.channel,
        count: this.count
      } as AudienceClientsDialogData
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

  loadSavedAudience() {
    const saved = this.savedAudiences.find((audience) => audience.id === this.savedAudienceId);
    if (!saved) {
      return;
    }
    this.filters = this.toRows(JSON.parse(saved.audience || '[]') as AudienceFilter[]);
    this.audienceName = '';
    this.audienceNameHint = `e.g. ${saved.name}`;
    this.audienceMessage = `Loaded "${saved.name}". Type its name again to update it, or a new name to save a copy.`;
    this.recount();
  }

  saveAudience() {
    const name = this.audienceName.trim();
    if (!name || !this.cleanFilters().length) {
      this.audienceMessage = 'Give the audience a name and at least one filter.';
      return;
    }
    const existing = this.savedAudiences.find((audience) => audience.name.toLowerCase() === name.toLowerCase());
    this.savingAudience = true;
    this.service.saveAudience(name, this.cleanFilters(), existing?.id).subscribe({
      next: () => {
        this.audienceMessage = existing ? `Updated "${name}".` : `Saved as "${name}".`;
        this.savingAudience = false;
        this.loadSavedAudiences();
      },
      error: () => {
        this.savingAudience = false;
        this.changeDetector.markForCheck();
      }
    });
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

  /** Rows with a value only: an empty row added by mistake doesn't block the count. */
  cleanFilters(): AudienceFilter[] {
    return this.filters
      .filter((row) => row.values.some((value) => value !== '' && value !== null && value !== undefined))
      .map((row) => ({
        field: row.field,
        operator: row.operator,
        values: row.values,
        includeChildren: row.field === 'OFFICE' ? !!row.includeChildren : undefined
      }));
  }

  private toRows(filters: AudienceFilter[]): FilterRow[] {
    return filters.map((filter) => ({
      ...filter,
      operator: filter.operator || 'IN',
      values: filter.values || []
    }));
  }

  private loadSavedAudiences() {
    this.service.getSavedAudiences(0, 500).subscribe((page) => {
      this.savedAudiences = page.pageItems;
      if (this.startAudienceId) {
        this.savedAudienceId = this.startAudienceId;
        this.startAudienceId = null;
        this.loadSavedAudience();
      }
      this.changeDetector.markForCheck();
    });
  }

  private emit() {
    this.changed.emit({
      filters: this.cleanFilters(),
      count: this.count,
      counting: this.counting,
      summary: this.filters.map((row) => this.audienceSummary(row))
    });
  }
}
