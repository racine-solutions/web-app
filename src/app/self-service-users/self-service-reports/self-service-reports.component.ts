/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/** Custom Imports */
import {
  SelfServiceAdoptionReport,
  SelfServiceFunnelReport,
  SelfServiceTransactionsReport
} from '../self-service-user.model';
import { SelfServiceUsersService } from '../self-service-users.service';

interface FunnelStep {
  label: string;
  count: number;
  /** Share of the people who signed up, in percent. */
  share: number;
}

/** Translation keys (labels.text) for refusal reasons. */
const REFUSAL_LABELS: Record<string, string> = {
  OWNERSHIP: 'Not one of the user s accounts',
  PER_TRANSFER_LIMIT: 'Above the per transfer limit',
  DAILY_LIMIT: 'Above the daily limit',
  OTHER: 'Other'
};

/** Translation keys (labels.text) for transfer channels. */
const CHANNEL_LABELS: Record<string, string> = {
  ACCOUNT_TRANSFER: 'Between own accounts',
  CONFIRMED_TRANSFER: 'Confirmed with a code',
  SINPE: 'SINPE Movil'
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Reports on the mobile app: adoption by office, sign-up funnel and app transactions (incl. refused attempts). */
@Component({
  selector: 'mifosx-self-service-reports',
  templateUrl: './self-service-reports.component.html',
  styleUrls: ['./self-service-reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class SelfServiceReportsComponent implements OnInit {
  private service = inject(SelfServiceUsersService);
  private changeDetector = inject(ChangeDetectorRef);

  readonly refusalLabels = REFUSAL_LABELS;
  readonly channelLabels = CHANNEL_LABELS;
  readonly monthOptions = [
    6,
    12,
    24,
    36
  ];

  form = new FormGroup({
    officeId: new FormControl<number | null>(null),
    months: new FormControl<number>(12),
    fromDate: new FormControl<string>(isoDate(new Date(Date.now() - 29 * 24 * 3600 * 1000))),
    toDate: new FormControl<string>(isoDate(new Date()))
  });

  offices: { id: number; name: string }[] = [];
  adoption: SelfServiceAdoptionReport;
  funnel: SelfServiceFunnelReport;
  funnelSteps: FunnelStep[] = [];
  transactions: SelfServiceTransactionsReport;
  /** Highest monthly value, for scaling the bars. */
  monthMax = 1;
  loading = false;

  ngOnInit() {
    this.service.getOffices().subscribe((offices) => {
      this.offices = offices;
      this.changeDetector.markForCheck();
    });
    this.load();
  }

  load() {
    const { officeId, months, fromDate, toDate } = this.form.getRawValue();
    this.loading = true;
    this.changeDetector.markForCheck();
    forkJoin({
      adoption: this.service.getAdoptionReport(officeId, months),
      funnel: this.service.getFunnelReport(officeId, fromDate, toDate),
      transactions: this.service.getTransactionsReport(officeId, fromDate, toDate)
    }).subscribe({
      next: ({ adoption, funnel, transactions }) => {
        this.adoption = adoption;
        this.monthMax = Math.max(1, ...adoption.months.map((m) => Math.max(m.signUps, m.firstLogins)));
        this.funnel = funnel;
        this.funnelSteps = this.toSteps(funnel);
        this.transactions = transactions;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.changeDetector.markForCheck();
      }
    });
  }

  barHeight(value: number): string {
    return `${(value / this.monthMax) * 100}%`;
  }

  exportAdoptionCsv() {
    this.download('mobile-app-adoption.csv', [
      [
        'Office',
        'Active clients',
        'Clients using the app',
        'Adoption rate (%)',
        'App users',
        'Active app users',
        'Logged in last 30 days'
      ],
      ...this.adoption.offices.map((o) => [
        o.officeName,
        o.activeClients,
        o.clientsUsingApp,
        o.adoptionRate,
        o.appUsers,
        o.activeAppUsers,
        o.loggedInLast30Days
      ])
    ]);
  }

  exportTransactionsCsv() {
    this.download(`mobile-app-transactions-${this.transactions.fromDate}-${this.transactions.toDate}.csv`, [
      [
        'Day',
        'Currency',
        'Transfers',
        'Amount'
      ],
      ...this.transactions.days.map((d) => [
        d.day,
        d.currencyCode,
        d.transfers,
        d.amount
      ])
    ]);
  }

  private toSteps(funnel: SelfServiceFunnelReport): FunnelStep[] {
    const share = (count: number) => (funnel.signedUp ? Math.round((count / funnel.signedUp) * 1000) / 10 : 0);
    return [
      { label: 'Signed up', count: funnel.signedUp, share: funnel.signedUp ? 100 : 0 },
      { label: 'Confirmed registration code', count: funnel.confirmed, share: share(funnel.confirmed) },
      { label: 'Logged in', count: funnel.loggedIn, share: share(funnel.loggedIn) },
      { label: 'Made a transfer', count: funnel.transacted, share: share(funnel.transacted) }
    ];
  }

  private download(fileName: string, rows: unknown[][]) {
    // Cells starting with = + - @ are prefixed so spreadsheets do not run them as formulas
    const cell = (value: unknown) => {
      const text = String(value ?? '');
      const safe = /^[=+\-@]/.test(text) && isNaN(Number(text)) ? `'${text}` : text;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const csv = rows.map((row) => row.map(cell).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
