/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { Component, OnInit, inject } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource
} from '@angular/material/table';
import { MatProgressBar } from '@angular/material/progress-bar';
import { DatetimeFormatPipe } from 'app/pipes/datetime-format.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { SystemService } from '../../system.service';
import { SmsMessage } from './sms-message.model';

/**
 * SMS messages component.
 */
@Component({
  selector: 'mifosx-sms-messages',
  templateUrl: './sms-messages.component.html',
  styleUrls: ['./sms-messages.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
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
    MatNoDataRow,
    MatPaginator,
    MatProgressBar,
    DatetimeFormatPipe
  ]
})
export class SmsMessagesComponent implements OnInit {
  private systemService = inject(SystemService);

  displayedColumns: string[] = [
    'id',
    'message',
    'number',
    'senderid',
    'smsTypeEnum',
    'status',
    'createdOnUtc'
  ];
  dataSource = new MatTableDataSource<SmsMessage>([]);
  totalRows = 0;
  pageSize = 10;
  currentPage = 0;
  isLoading = false;

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    this.isLoading = true;
    this.systemService.getSmsMessages(this.currentPage * this.pageSize, this.pageSize).subscribe({
      next: (messagesPage) => {
        this.dataSource.data = messagesPage.pageItems;
        this.totalRows = messagesPage.totalFilteredRecords;
        this.isLoading = false;
      },
      error: () => {
        this.dataSource.data = [];
        this.totalRows = 0;
        this.isLoading = false;
      }
    });
  }

  pageChanged(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadMessages();
  }

  getStatusLabel(message: SmsMessage): string {
    return message.hasPassed ? 'Sent' : 'Failed';
  }
}
