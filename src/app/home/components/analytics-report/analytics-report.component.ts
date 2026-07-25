import { Component, OnInit, inject } from '@angular/core';
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

  ngOnInit() {
    this.reportsService.getAnalyticsReport().subscribe((response: any) => {
      this.analyticsData = response;
    });
  }
}
