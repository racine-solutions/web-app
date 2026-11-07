/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatStep, MatStepper, MatStepperNext, MatStepperPrevious } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Subject, debounceTime, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

import { AudienceClient, AudienceCount, AudienceFilter, reasonLabel } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';
import { AudienceEditorComponent, AudienceState } from '../audience-editor/audience-editor.component';

/**
 * Create or change a saved audience on its own, in three steps: filters, a review of the matching clients where some can
 * be left out, then a name. Left-out clients are saved as a "Specific clients: all but these" filter.
 */
@Component({
  selector: 'mifosx-audience-form',
  templateUrl: './audience-form.component.html',
  styleUrls: [
    '../campaigns.scss',
    './audience-form.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FormsModule,
    MatIcon,
    MatCheckbox,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatStepper,
    MatStep,
    MatStepperNext,
    MatStepperPrevious,
    MatPaginator,
    AudienceEditorComponent
  ]
})
export class AudienceFormComponent implements OnInit {
  private service = inject(CampaignsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly reasonLabel = reasonLabel;

  audienceId?: number;
  name = new FormControl('', [
    Validators.required,
    Validators.maxLength(100)
  ]);
  /** Only changes how the count is checked: whose phone or email, and whether opted-out clients are left out. */
  channel: 'SMS' | 'EMAIL' = 'SMS';
  marketing = false;
  initialFilters: AudienceFilter[] | null = null;
  state: AudienceState | null = null;
  loaded = true;
  saving = false;

  /** Step 2: the matching clients, one page at a time. */
  clients: AudienceClient[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 25;
  loadingClients = false;
  search = new FormControl('');
  /** Clients left out, by id, with their names for the chips. */
  excluded = new Map<string, string>();

  /** Step 3: the count with the left-out clients removed. */
  finalCount: AudienceCount | null = null;

  private clientRequests = new Subject<void>();

  ngOnInit() {
    this.audienceId = Number(this.route.snapshot.paramMap.get('audienceId')) || undefined;
    if (this.audienceId) {
      this.loaded = false;
      this.service.getSavedAudiences(0, 500).subscribe((page) => {
        const saved = page.pageItems.find((audience) => audience.id === this.audienceId);
        if (saved) {
          this.name.setValue(saved.name);
          this.initialFilters = JSON.parse(saved.audience || '[]') as AudienceFilter[];
        }
        this.loaded = true;
        this.changeDetector.markForCheck();
      });
    }
    this.clientRequests
      .pipe(
        debounceTime(250),
        switchMap(() => {
          this.loadingClients = true;
          this.changeDetector.markForCheck();
          return this.service
            .audienceClients(
              this.state?.filters || [],
              this.purpose,
              {
                show: 'ALL',
                search: this.search.value || '',
                offset: this.pageIndex * this.pageSize,
                limit: this.pageSize
              },
              this.channel
            )
            .pipe(catchError(() => of({ totalFilteredRecords: 0, pageItems: [] as AudienceClient[] })));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((page) => {
        this.clients = page.pageItems;
        this.total = page.totalFilteredRecords;
        this.loadingClients = false;
        this.changeDetector.markForCheck();
      });
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.pageIndex = 0;
      this.clientRequests.next();
    });
  }

  get purpose(): string {
    return this.marketing ? 'MARKETING' : 'GENERAL';
  }

  audienceChanged(state: AudienceState) {
    this.state = state;
    this.changeDetector.markForCheck();
  }

  get hasFilters(): boolean {
    return !!this.state?.filters.length;
  }

  /** Loads the client list when the review step opens and the count when the last step opens. */
  stepChanged(event: StepperSelectionEvent) {
    if (event.selectedIndex === 1) {
      this.pageIndex = 0;
      this.clientRequests.next();
    }
    if (event.selectedIndex === 2) {
      this.finalCount = null;
      this.service.countAudience(this.filtersToSave, this.purpose, this.channel).subscribe((count) => {
        this.finalCount = count;
        this.changeDetector.markForCheck();
      });
    }
  }

  page(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.clientRequests.next();
  }

  isExcluded(client: AudienceClient): boolean {
    return this.excluded.has(String(client.clientId));
  }

  toggle(client: AudienceClient) {
    const id = String(client.clientId);
    if (this.excluded.has(id)) {
      this.excluded.delete(id);
    } else {
      this.excluded.set(id, client.displayName);
    }
    this.excluded = new Map(this.excluded);
    this.changeDetector.markForCheck();
  }

  include(id: string) {
    this.excluded.delete(id);
    this.excluded = new Map(this.excluded);
    this.changeDetector.markForCheck();
  }

  get excludedList(): { id: string; name: string }[] {
    return Array.from(
      this.excluded,
      ([
        id,
        name
      ]) => ({ id, name })
    );
  }

  /** The filters, plus the left-out clients as "all but these" (joined to such a filter if there is one already). */
  get filtersToSave(): AudienceFilter[] {
    const filters = (this.state?.filters || []).map((filter) => ({ ...filter, values: [...filter.values] }));
    if (!this.excluded.size) {
      return filters;
    }
    const ids = Array.from(this.excluded.keys());
    const existing = filters.find((filter) => filter.field === 'CLIENT' && filter.operator === 'NOT_IN');
    if (existing) {
      existing.values = Array.from(
        new Set([
          ...existing.values,
          ...ids
        ])
      );
    } else {
      filters.push({ field: 'CLIENT', operator: 'NOT_IN', values: ids });
    }
    return filters;
  }

  get canSave(): boolean {
    return this.name.valid && this.hasFilters && !this.saving;
  }

  save() {
    if (!this.canSave) {
      this.name.markAsTouched();
      return;
    }
    this.saving = true;
    this.service.saveAudience((this.name.value || '').trim(), this.filtersToSave, this.audienceId).subscribe({
      next: () =>
        this.router.navigate([
          '/system',
          'premium-feature',
          'campaigns',
          'audiences'
        ]),
      error: () => {
        this.saving = false;
        this.changeDetector.markForCheck();
      }
    });
  }
}
