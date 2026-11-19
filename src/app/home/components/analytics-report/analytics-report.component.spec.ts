/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeDetectionStrategy, Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ReportsService } from 'app/reports/reports.service';

import { AnalyticsReportComponent } from './analytics-report.component';

/** Stands in for the dashboard, which holds the report and is OnPush. */
@Component({
  selector: 'mifosx-onpush-host',
  template: '<mifosx-analytics-report></mifosx-analytics-report>',
  imports: [AnalyticsReportComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
class OnPushHostComponent {}

describe('AnalyticsReportComponent', () => {
  let fixture: ComponentFixture<OnPushHostComponent>;
  let report: Subject<any>;

  beforeEach(async () => {
    report = new Subject<any>();
    await TestBed.configureTestingModule({
      imports: [OnPushHostComponent],
      providers: [{ provide: ReportsService, useValue: { getAnalyticsReport: () => report } }]
    })
      .overrideComponent(AnalyticsReportComponent, { set: { schemas: [NO_ERRORS_SCHEMA] } })
      .compileComponents();

    fixture = TestBed.createComponent(OnPushHostComponent);
    fixture.detectChanges();
  });

  it('shows the report as soon as it arrives inside an OnPush dashboard', () => {
    report.next({ activeLoansCount: 42 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('42');
  });
});
