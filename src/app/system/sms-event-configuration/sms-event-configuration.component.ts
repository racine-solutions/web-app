import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource
} from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { SystemService } from '../system.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatLabel } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { HasPermissionDirective } from 'app/directives/has-permission/has-permission.directive';
import { TranslatePipe } from '@pipes/translate.pipe';
import { CommonModule } from '@angular/common';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-sms-event-configuration',
  templateUrl: './sms-event-configuration.component.html',
  styleUrls: ['./sms-event-configuration.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    CommonModule,
    MatPaginator,
    MatSort,
    MatFormFieldModule,
    MatLabel,
    MatTableModule,
    MatInputModule,
    TranslateModule,
    HasPermissionDirective,
    TranslatePipe,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    MatSlideToggle,
    FormsModule,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow
  ]
})
export class SmsEventConfigurationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private systemService = inject(SystemService);
  /** Events Data. */
  eventsData: any;
  smsEventConfigurations: any = {};

  existAnyUpdate = false;

  /** Columns to be displayed in events table. */
  displayedColumns: string[] = [
    'eventType',
    'status'
  ];
  /** Data source for reports table. */
  dataSource: MatTableDataSource<any>;

  /** Paginator for reports table. */
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  /** Sorter for reports table. */
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor() {
    this.route.data.subscribe((data: { events: any }) => {
      this.eventsData = data.events.smsEventConfiguration;
    });
  }

  ngOnInit() {
    this.setEventDatasource();
  }

  /**
   * Initializes the data source, paginator and sorter for events table.
   */
  setEventDatasource() {
    this.dataSource = new MatTableDataSource(this.eventsData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Enables/Disables respective event
   */
  toggleStatus(event: any) {
    this.smsEventConfigurations[event.type] = event.enabled;
    this.existAnyUpdate = true;
  }

  /**
   * Filter using the event type value
   */
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  /**
   * send the changes to the backend
   */
  applyChanges() {
    const payload = {
      smsEventConfigurations: this.smsEventConfigurations
    };

    this.systemService.putSmsEventConfiguration(payload).subscribe(() => {
      this.existAnyUpdate = false;
    });
  }
}
