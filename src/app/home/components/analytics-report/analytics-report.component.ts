import { Component, OnInit } from '@angular/core';
import { ReportsService } from 'app/reports/reports.service';

@Component({
  selector: 'mifosx-analytics-report',
  templateUrl: './analytics-report.component.html',
  styleUrls: ['./analytics-report.component.scss']
})
export class AnalyticsReportComponent implements OnInit {

  analyticsData: any;

  constructor(private reportsService: ReportsService) { }

  ngOnInit() {
    this.reportsService.getAnalyticsReport().subscribe((response: any) => {
      this.analyticsData = response;
    });
  }

}
