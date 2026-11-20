/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/** Angular Imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';
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
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/** rxjs Imports */
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/** Custom Imports */
import { AccessDialogComponent, AccessDialogData } from './access-dialog/access-dialog.component';
import { OfficerActivityComponent } from './officer-activity/officer-activity.component';
import {
  DEVICE_COMMAND_PERMISSIONS,
  DeviceCommand,
  OFFICER_COMMAND_PERMISSIONS,
  OfficerAppDevice,
  OfficerAppSummary,
  OfficerAppUser,
  OfficerCommand,
  deviceCommands,
  officerCommands,
  onlineLabel,
  onlineSeverity
} from './officer-app.model';
import { DeviceFilters, OfficerAppService, OfficerFilters } from './officer-app.service';

/** Largest export the server returns in one request. */
const EXPORT_LIMIT = 500;

/** Tabs of the dashboard. */
enum Tab {
  Officers = 0,
  Devices = 1,
  Activity = 2
}

/**
 * Admin › Mobile Officer App: how many devices are connected, who is online, and every staff user's field officer app
 * access, in the admin's office and the offices under it.
 */
@Component({
  selector: 'mifosx-officer-app',
  templateUrl: './officer-app.component.html',
  styleUrls: ['./officer-app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    RouterLink,
    FaIconComponent,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatSort,
    MatSortHeader,
    MatPaginator,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatIconButton,
    OfficerActivityComponent
  ]
})
export class OfficerAppComponent implements OnInit {
  private service = inject(OfficerAppService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly Tab = Tab;
  readonly officerPermissions = OFFICER_COMMAND_PERMISSIONS;
  readonly devicePermissions = DEVICE_COMMAND_PERMISSIONS;
  readonly officerCommands = officerCommands;
  readonly deviceCommands = deviceCommands;
  readonly onlineSeverity = onlineSeverity;
  readonly onlineLabel = onlineLabel;
  readonly onlineOptions = [
    { value: 'ONLINE', label: 'Online' },
    { value: 'IDLE', label: 'Idle' },
    { value: 'SIGNED_OUT', label: 'Signed out' }
  ];
  readonly accessOptions = [
    { value: 'ALLOWED', label: 'Allowed' },
    { value: 'OFF', label: 'Off' }
  ];

  summary: OfficerAppSummary | null = null;
  offices: { id: number; name: string }[] = [];
  /** Bumped after every change so the activity tab reloads. */
  refreshCount = 0;
  tab = Tab.Officers;

  // Officers tab
  officerColumns = [
    'displayName',
    'officeName',
    'online',
    'devices',
    'access',
    'lastSeen',
    'lastAction',
    'actions'
  ];
  officers = new MatTableDataSource<OfficerAppUser>([]);
  officerTotal = 0;
  officerFilters: OfficerFilters = {};
  officerPage = { index: 0, size: 25 };
  officersLoading = false;

  // Devices tab
  deviceColumns = [
    'device',
    'officer',
    'android',
    'appVersion',
    'firstSeen',
    'lastSeen',
    'lastIp',
    'status',
    'actions'
  ];
  devices = new MatTableDataSource<OfficerAppDevice>([]);
  deviceTotal = 0;
  deviceFilters: DeviceFilters = {};
  devicePage = { index: 0, size: 25 };
  devicesLoading = false;

  private officerSearch = new Subject<string>();
  private deviceSearch = new Subject<string>();

  ngOnInit() {
    this.officerSearch
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((text) => this.setOfficerFilter({ search: text || undefined }));
    this.deviceSearch
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((text) => this.setDeviceFilter({ search: text || undefined }));
    this.service.getOffices().subscribe((offices) => {
      this.offices = offices || [];
      this.changeDetector.markForCheck();
    });
    this.loadSummary();
    this.loadOfficers();
    this.loadDevices();
  }

  // ---- KPI cards act as quick filters ----

  showConnectedDevices() {
    this.deviceFilters = { signedIn: true };
    this.devicePage.index = 0;
    this.tab = Tab.Devices;
    this.loadDevices();
  }

  showOfficers(filters: OfficerFilters) {
    this.officerFilters = filters;
    this.officerPage.index = 0;
    this.tab = Tab.Officers;
    this.loadOfficers();
  }

  showOldVersions() {
    const old = this.summary?.appVersions?.find((v) => v.belowMinimum);
    this.deviceFilters = old ? { appVersion: old.version } : {};
    this.devicePage.index = 0;
    this.tab = Tab.Devices;
    this.loadDevices();
  }

  // ---- Officers ----

  onOfficerSearch(text: string) {
    this.officerSearch.next(text.trim());
  }

  setOfficerFilter(change: OfficerFilters) {
    this.officerFilters = { ...this.officerFilters, ...change };
    this.officerPage.index = 0;
    this.loadOfficers();
  }

  onOfficerPage(event: PageEvent) {
    this.officerPage = { index: event.pageIndex, size: event.pageSize };
    this.loadOfficers();
  }

  onOfficerSort(sort: Sort) {
    this.setOfficerFilter({
      orderBy: sort.direction ? sort.active : undefined,
      sortOrder: sort.direction ? sort.direction.toUpperCase() : undefined
    });
  }

  openOfficer(user: OfficerAppUser) {
    this.router.navigate([
      '/officerapp',
      user.userId
    ]);
  }

  runOfficerCommand(user: OfficerAppUser, command: OfficerCommand) {
    const data: AccessDialogData = {
      command,
      officerName: user.displayName,
      username: user.username,
      activeDevices: user.devices - user.blockedDevices
    };
    this.dialog
      .open(AccessDialogComponent, { data })
      .afterClosed()
      .subscribe((body) => {
        if (body) {
          this.service.officerCommand(user.userId, command, body).subscribe(() => this.reloadAll());
        }
      });
  }

  // ---- Devices ----

  onDeviceSearch(text: string) {
    this.deviceSearch.next(text.trim());
  }

  setDeviceFilter(change: DeviceFilters) {
    this.deviceFilters = { ...this.deviceFilters, ...change };
    this.devicePage.index = 0;
    this.loadDevices();
  }

  onDevicePage(event: PageEvent) {
    this.devicePage = { index: event.pageIndex, size: event.pageSize };
    this.loadDevices();
  }

  runDeviceCommand(device: OfficerAppDevice, command: DeviceCommand) {
    const data: AccessDialogData = { command, officerName: device.officerName, username: device.username, device };
    this.dialog
      .open(AccessDialogComponent, { data })
      .afterClosed()
      .subscribe((body) => {
        if (body) {
          this.service.deviceCommand(device.id, command, body).subscribe(() => this.reloadAll());
        }
      });
  }

  /** Field officer app settings live in System › Configurations. */
  openSettings() {
    this.router.navigate(
      [
        '/system',
        'configurations'
      ],
      { queryParams: { filter: 'officer' } }
    );
  }

  exportCsv() {
    this.service.getOfficers({ ...this.officerFilters, offset: 0, limit: EXPORT_LIMIT }).subscribe((page) => {
      const header = [
        'Name',
        'Username',
        'Office',
        'Online',
        'Devices',
        'Blocked devices',
        'App access',
        'Access reason',
        'Last seen (UTC)',
        'Last action'
      ];
      const rows = page.pageItems.map((u) => [
        u.displayName,
        u.username,
        u.officeName,
        onlineLabel(u.onlineStatus),
        u.devices,
        u.blockedDevices,
        u.accessStatus,
        u.accessReason,
        u.lastSeenOn,
        u.lastAction
      ]);
      const csv = [
        header,
        ...rows
      ]
        .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'mobile-officer-app.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  private reloadAll() {
    this.refreshCount++;
    this.loadSummary();
    this.loadOfficers();
    this.loadDevices();
  }

  private loadSummary() {
    this.service.getSummary().subscribe((summary) => {
      this.summary = summary;
      this.changeDetector.markForCheck();
    });
  }

  private loadOfficers() {
    this.officersLoading = true;
    this.service
      .getOfficers({
        ...this.officerFilters,
        offset: this.officerPage.index * this.officerPage.size,
        limit: this.officerPage.size
      })
      .subscribe({
        next: (page) => {
          this.officers.data = page.pageItems || [];
          this.officerTotal = page.totalFilteredRecords || 0;
          this.officersLoading = false;
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.officersLoading = false;
          this.changeDetector.markForCheck();
        }
      });
  }

  private loadDevices() {
    this.devicesLoading = true;
    this.service
      .getDevices({
        ...this.deviceFilters,
        offset: this.devicePage.index * this.devicePage.size,
        limit: this.devicePage.size
      })
      .subscribe({
        next: (page) => {
          this.devices.data = page.pageItems || [];
          this.deviceTotal = page.totalFilteredRecords || 0;
          this.devicesLoading = false;
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.devicesLoading = false;
          this.changeDetector.markForCheck();
        }
      });
  }
}
