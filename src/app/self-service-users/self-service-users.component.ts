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
import { Router } from '@angular/router';
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
import { ChangeAccessDialogComponent } from './change-access-dialog/change-access-dialog.component';
import {
  COMMAND_PERMISSIONS,
  SelfServiceUser,
  SelfServiceUserCommand,
  SelfServiceUserStatus,
  SelfServiceUserSummary,
  availableCommands,
  statusSeverity
} from './self-service-user.model';
import { SelfServiceUserFilters, SelfServiceUsersService } from './self-service-users.service';

/** Largest export the server returns in one request. */
const EXPORT_LIMIT = 500;

/**
 * Back-office list of mobile app (self-service) users in the staff member's office and child offices.
 */
@Component({
  selector: 'mifosx-self-service-users',
  templateUrl: './self-service-users.component.html',
  styleUrls: ['./self-service-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
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
    MatIconButton
  ]
})
export class SelfServiceUsersComponent implements OnInit {
  private service = inject(SelfServiceUsersService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly statuses = [
    { value: SelfServiceUserStatus.Pending, label: 'Pending' },
    { value: SelfServiceUserStatus.Active, label: 'Active' },
    { value: SelfServiceUserStatus.ViewOnly, label: 'View only' },
    { value: SelfServiceUserStatus.Suspended, label: 'Suspended' },
    { value: SelfServiceUserStatus.Closed, label: 'Closed' }
  ];
  readonly commandPermissions = COMMAND_PERMISSIONS;
  readonly statusSeverity = statusSeverity;
  readonly availableCommands = availableCommands;

  displayedColumns: string[] = [
    'displayName',
    'client',
    'officeName',
    'status',
    'createdOn',
    'lastLoginOn',
    'actions'
  ];
  /** Rows of the current page; MatTableDataSource pushes every new page to the table. */
  dataSource = new MatTableDataSource<SelfServiceUser>([]);
  summary: SelfServiceUserSummary | null = null;
  totalRecords = 0;
  loading = false;

  search = '';
  status: number | null = null;
  lockedOnly = false;
  pageIndex = 0;
  pageSize = 25;
  orderBy = '';
  sortOrder = '';

  private searchChanges = new Subject<string>();

  ngOnInit() {
    this.searchChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((text) => {
        this.search = text;
        this.pageIndex = 0;
        this.loadUsers();
      });
    this.loadSummary();
    this.loadUsers();
  }

  onSearch(text: string) {
    this.searchChanges.next(text.trim());
  }

  onStatusChange(status: number | null) {
    this.status = status;
    this.pageIndex = 0;
    this.loadUsers();
  }

  onLockedChange(lockedOnly: boolean) {
    this.lockedOnly = lockedOnly;
    this.pageIndex = 0;
    this.loadUsers();
  }

  /** Summary tiles act as quick filters. */
  showStatus(status: number | null, lockedOnly = false) {
    this.status = status;
    this.lockedOnly = lockedOnly;
    this.pageIndex = 0;
    this.loadUsers();
  }

  onPage(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  onSort(sort: Sort) {
    this.orderBy = sort.direction ? sort.active : '';
    this.sortOrder = sort.direction ? sort.direction.toUpperCase() : '';
    this.pageIndex = 0;
    this.loadUsers();
  }

  openUser(user: SelfServiceUser) {
    this.router.navigate([
      '/selfserviceusers',
      user.id
    ]);
  }

  runCommand(user: SelfServiceUser, command: SelfServiceUserCommand) {
    this.dialog
      .open(ChangeAccessDialogComponent, { data: { command, user } })
      .afterClosed()
      .subscribe((body) => {
        if (!body) {
          return;
        }
        this.service.executeCommand(user.id, command, body).subscribe(() => {
          this.loadSummary();
          this.loadUsers();
        });
      });
  }

  exportCsv() {
    this.service.getUsers({ ...this.filters(), offset: 0, limit: EXPORT_LIMIT }).subscribe((page) => {
      const header = [
        'Name',
        'Username',
        'Email',
        'Mobile',
        'Client account',
        'Office',
        'Status',
        'Locked',
        'Signed up (UTC)',
        'Last login (UTC)'
      ];
      const rows = page.pageItems.map((u) => [
        u.displayName,
        u.username,
        u.email,
        u.mobileNo,
        u.clientAccountNo,
        u.officeName,
        u.status?.value,
        u.locked ? 'Yes' : 'No',
        u.createdOn,
        u.lastLoginOn
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
      link.download = 'self-service-users.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  private filters(): SelfServiceUserFilters {
    return {
      search: this.search || undefined,
      status: this.status ?? undefined,
      locked: this.lockedOnly ? true : undefined,
      orderBy: this.orderBy || undefined,
      sortOrder: this.sortOrder || undefined
    };
  }

  private loadUsers() {
    this.loading = true;
    this.service
      .getUsers({ ...this.filters(), offset: this.pageIndex * this.pageSize, limit: this.pageSize })
      .subscribe({
        next: (page) => {
          this.dataSource.data = page.pageItems || [];
          this.totalRecords = page.totalFilteredRecords || 0;
          this.loading = false;
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.changeDetector.markForCheck();
        }
      });
  }

  private loadSummary() {
    this.service.getSummary().subscribe((summary) => {
      this.summary = summary;
      this.changeDetector.markForCheck();
    });
  }
}
