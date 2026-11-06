/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ReportsService } from 'app/reports/reports.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mifosx-analytics-report',
  templateUrl: './analytics-report.component.html',
  styleUrls: ['./analytics-report.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule
  ]
})
export class AnalyticsReportComponent implements OnInit {
  analyticsData: any;
  objectKeys = Object.keys;
  private reportsService = inject(ReportsService);
  private changeDetector = inject(ChangeDetectorRef);

  ngOnInit() {
    this.reportsService.getAnalyticsReport().subscribe((response: any) => {
      this.analyticsData = response;
      // The dashboard around this report is OnPush: without this the report stays blank until something else (such as
      // switching tabs) makes the dashboard check again
      this.changeDetector.markForCheck();
    });
  }
}
