/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

import { AudienceFilter, SavedAudience } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';

/** Saved audiences: named sets of filters any campaign can start from. */
@Component({
  selector: 'mifosx-saved-audiences',
  templateUrl: './saved-audiences.component.html',
  styleUrls: [
    '../campaigns.scss',
    '../campaign-list/campaign-list.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatIcon,
    MatPaginator
  ]
})
export class SavedAudiencesComponent implements OnInit {
  private service = inject(CampaignsService);
  private changeDetector = inject(ChangeDetectorRef);

  audiences: SavedAudience[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 25;
  loading = true;
  confirming: number | null = null;

  ngOnInit() {
    this.load();
  }

  page(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  filters(audience: SavedAudience): string {
    const filters = JSON.parse(audience.audience || '[]') as AudienceFilter[];
    return filters.map((filter) => filter.field.replace(/_/g, ' ').toLowerCase()).join(' · ');
  }

  delete(audience: SavedAudience) {
    this.service.deleteSavedAudience(audience.id).subscribe(() => {
      this.confirming = null;
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.service.getSavedAudiences(this.pageIndex * this.pageSize, this.pageSize).subscribe({
      next: (page) => {
        this.audiences = page.pageItems;
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
