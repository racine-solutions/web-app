/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/** Angular Imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/** Custom Imports */
import { OfficerAppEvent, OfficerAppEventFilter } from '../officer-app.model';
import { OfficerAppService } from '../officer-app.service';

interface TimelineFilter {
  label: string;
  filter: OfficerAppEventFilter;
}

const PAGE_SIZE = 20;

/**
 * Field officer app activity, newest first: sign-ins, what officers did in the app, offline syncs, report runs and
 * admin access changes. Shows one officer (userId) or every officer in the admin's offices.
 */
@Component({
  selector: 'mifosx-officer-activity',
  templateUrl: './officer-activity.component.html',
  styleUrls: ['./officer-activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    RouterLink
  ]
})
export class OfficerActivityComponent implements OnChanges {
  private service = inject(OfficerAppService);
  private changeDetector = inject(ChangeDetectorRef);

  /** One officer; leave empty for all officers. */
  @Input() userId: number | null = null;
  /** Changes whenever the page reloads, so admins see their own change straight away. */
  @Input() refresh = 0;
  @Input() title = 'Activity Timeline';

  readonly filters: TimelineFilter[] = [
    { label: 'All', filter: {} },
    { label: 'Sign-ins', filter: { category: 'LOGIN' } },
    { label: 'Actions', filter: { category: 'ACTION' } },
    { label: 'Offline sync', filter: { category: 'SYNC' } },
    { label: 'Reports', filter: { category: 'REPORT' } },
    { label: 'Access changes', filter: { category: 'ACCESS' } },
    { label: 'Refused', filter: { result: 'REFUSED' } }
  ];
  selected = this.filters[0];
  events: OfficerAppEvent[] = [];
  total = 0;
  loading = false;

  ngOnChanges() {
    this.load(true);
  }

  select(filter: TimelineFilter) {
    this.selected = filter;
    this.load(true);
  }

  loadMore() {
    this.load(false);
  }

  /** The admin's reason, from the event details. */
  reasonOf(event: OfficerAppEvent): string | null {
    if (!event.details) {
      return null;
    }
    try {
      const details = JSON.parse(event.details) as Record<string, unknown>;
      return details['reason'] ? String(details['reason']) : null;
    } catch {
      return null;
    }
  }

  severity(event: OfficerAppEvent): string {
    if (event.result === 'REFUSED' || event.result === 'FAILED') {
      return 'suspended';
    }
    if (event.actor === 'STAFF') {
      return 'viewonly';
    }
    return event.category === 'SYNC' ? 'pending' : 'active';
  }

  private load(reset: boolean) {
    const offset = reset ? 0 : this.events.length;
    this.loading = true;
    this.changeDetector.markForCheck();
    this.service.getEvents(this.userId, this.selected.filter, offset, PAGE_SIZE).subscribe({
      next: (page) => {
        this.events = reset ? page.pageItems : [
              ...this.events,
              ...page.pageItems
            ];
        this.total = page.totalFilteredRecords;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.changeDetector.markForCheck();
      }
    });
  }
}
