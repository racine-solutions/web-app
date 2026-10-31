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
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/** rxjs Imports */
import { debounceTime, filter, switchMap } from 'rxjs/operators';

/** Custom Imports */
import { ClientsService } from 'app/clients/clients.service';
import { SelfServiceUser, SelfServiceUserClient } from '../self-service-user.model';

interface PickedClient {
  id: number;
  displayName: string;
  accountNo?: string;
  officeName?: string;
}

/** Changes the clients a self-service user acts for. Returns { clientIds, reason }. */
@Component({
  selector: 'mifosx-clients-dialog',
  templateUrl: './clients-dialog.component.html',
  styleUrls: ['./clients-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatAutocomplete,
    MatAutocompleteTrigger
  ]
})
export class ClientsDialogComponent implements OnInit {
  data = inject<{ user: SelfServiceUser }>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ClientsDialogComponent>);
  private clientsService = inject(ClientsService);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  selected: PickedClient[] = (this.data.user.clients || []).map((c: SelfServiceUserClient) => ({
    id: c.id,
    displayName: c.displayName,
    accountNo: c.accountNo,
    officeName: c.officeName
  }));
  options: PickedClient[] = [];
  search = new UntypedFormControl('');
  reason = new UntypedFormControl('', Validators.maxLength(500));

  ngOnInit() {
    this.search.valueChanges
      .pipe(
        debounceTime(300),
        filter((value) => typeof value === 'string' && value.trim().length >= 2),
        switchMap((value: string) => this.clientsService.getFilteredClients('displayName', 'ASC', false, value.trim())),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((page: any) => {
        this.options = (page?.pageItems || []).map((c: any) => ({
          id: c.id,
          displayName: c.displayName,
          accountNo: c.accountNo,
          officeName: c.officeName
        }));
        this.changeDetector.markForCheck();
      });
  }

  pick(event: MatAutocompleteSelectedEvent) {
    const client: PickedClient = event.option.value;
    if (!this.selected.some((c) => c.id === client.id)) {
      this.selected = [
        ...this.selected,
        client
      ];
    }
    this.search.setValue('');
    this.options = [];
  }

  remove(client: PickedClient) {
    this.selected = this.selected.filter((c) => c.id !== client.id);
  }

  submit() {
    if (!this.selected.length || this.reason.invalid) {
      return;
    }
    const reason = (this.reason.value || '').trim() || undefined;
    this.dialogRef.close({ clientIds: this.selected.map((c) => c.id), reason });
  }
}
