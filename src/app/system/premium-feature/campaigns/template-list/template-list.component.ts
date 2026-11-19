/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

import { CommTemplate } from '../campaigns.model';
import { CampaignsService } from '../campaigns.service';

/** Communication templates, with how long each SMS can get. */
@Component({
  selector: 'mifosx-comm-template-list',
  templateUrl: './template-list.component.html',
  styleUrls: [
    '../campaigns.scss',
    '../campaign-list/campaign-list.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatIcon,
    MatCheckbox,
    FormsModule,
    MatPaginator
  ]
})
export class TemplateListComponent implements OnInit {
  private service = inject(CampaignsService);
  private changeDetector = inject(ChangeDetectorRef);

  templates: CommTemplate[] = [];
  showArchived = false;
  loading = true;
  total = 0;
  pageIndex = 0;
  pageSize = 25;

  ngOnInit() {
    this.load();
  }

  /** Back to the first page, e.g. when "Show archived" changes. */
  reload() {
    this.pageIndex = 0;
    this.load();
  }

  page(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  load() {
    this.loading = true;
    this.service.getTemplates(this.showArchived, this.pageIndex * this.pageSize, this.pageSize).subscribe({
      next: (page) => {
        this.templates = page.pageItems;
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

  archive(template: CommTemplate, event: Event) {
    event.stopPropagation();
    this.service.archiveTemplate(template.id).subscribe(() => this.load());
  }
}
