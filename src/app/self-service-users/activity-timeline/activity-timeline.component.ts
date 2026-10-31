/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, inject } from '@angular/core';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/** Custom Imports */
import { SelfServiceUserEvent, SelfServiceUserEventFilter } from '../self-service-user.model';
import { SelfServiceUsersService } from '../self-service-users.service';

interface TimelineFilter {
  label: string;
  filter: SelfServiceUserEventFilter;
}

const PAGE_SIZE = 20;

/**
 * Activity timeline of a mobile app user: what they did in the app, what staff changed on their access, and transfers
 * the app refused. Newest first, loaded a page at a time.
 */
@Component({
  selector: 'mifosx-self-service-activity-timeline',
  templateUrl: './activity-timeline.component.html',
  styleUrls: ['./activity-timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class ActivityTimelineComponent implements OnChanges {
  private service = inject(SelfServiceUsersService);
  private changeDetector = inject(ChangeDetectorRef);

  @Input({ required: true }) userId: number;
  /** Changes whenever the profile reloads, so staff see their own change straight away. */
  @Input() refresh = 0;

  readonly filters: TimelineFilter[] = [
    { label: 'All', filter: {} },
    { label: 'Logins', filter: { category: 'LOGIN' } },
    { label: 'Transfers', filter: { category: 'TRANSFER' } },
    { label: 'Access changes', filter: { category: 'ACCESS' } },
    { label: 'Refused', filter: { result: 'REFUSED' } }
  ];
  selected = this.filters[0];
  events: SelfServiceUserEvent[] = [];
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

  /** Extra facts as label/value pairs. */
  detailsOf(event: SelfServiceUserEvent): { key: string; value: string }[] {
    if (!event.details) {
      return [];
    }
    try {
      return Object.entries(JSON.parse(event.details) as Record<string, unknown>).map(
        ([
          key,
          value
        ]) => ({ key, value: String(value) })
      );
    } catch {
      return [];
    }
  }

  severity(event: SelfServiceUserEvent): string {
    if (event.result === 'REFUSED' || event.result === 'FAILED') {
      return 'suspended';
    }
    return event.actor === 'STAFF' ? 'viewonly' : 'active';
  }

  private load(reset: boolean) {
    if (!this.userId) {
      return;
    }
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
