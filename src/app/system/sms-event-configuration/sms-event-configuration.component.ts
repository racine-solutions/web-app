import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { SystemService } from '../system.service';

@Component({
  selector: 'mifosx-sms-event-configuration',
  templateUrl: './sms-event-configuration.component.html',
  styleUrls: ['./sms-event-configuration.component.scss'],
  standalone: true,
  imports: [MatPaginator, MatSort]
})
export class SmsEventConfigurationComponent implements OnInit {
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

  private route = inject(ActivatedRoute);
  private systemService = inject(SystemService);

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
    this.smsEventConfigurations[event.type] = !event.enabled;
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
