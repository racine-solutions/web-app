/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/** Custom Imports */
import { OrganizationService } from 'app/organization/organization.service';
import { SelfServiceUser, SelfServiceUserLimit } from '../self-service-user.model';

/** A row needs at least one limit, and the daily limit cannot be lower than the per-transfer limit. */
function limitRowValidator(row: AbstractControl): ValidationErrors | null {
  const perTransfer = row.get('perTransferLimit').value;
  const daily = row.get('dailyLimit').value;
  if (!perTransfer && !daily) {
    return { noLimit: true };
  }
  if (perTransfer && daily && Number(daily) < Number(perTransfer)) {
    return { dailyBelowPerTransfer: true };
  }
  return null;
}

/** Edits a self-service user's transfer limits (one row per currency). Returns { limits, reason }. */
@Component({
  selector: 'mifosx-limits-dialog',
  templateUrl: './limits-dialog.component.html',
  styleUrls: ['./limits-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose
  ]
})
export class LimitsDialogComponent implements OnInit {
  data = inject<{ user: SelfServiceUser }>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<LimitsDialogComponent>);
  private formBuilder = inject(UntypedFormBuilder);
  private organizationService = inject(OrganizationService);
  private changeDetector = inject(ChangeDetectorRef);

  currencies: { code: string; name: string }[] = [];
  form: UntypedFormGroup = this.formBuilder.group({
    limits: this.formBuilder.array([]),
    reason: [
      '',
      Validators.maxLength(500)
    ]
  });

  get limits(): UntypedFormArray {
    return this.form.get('limits') as UntypedFormArray;
  }

  ngOnInit() {
    (this.data.user.limits || []).forEach((limit) => this.addRow(limit));
    this.organizationService.getCurrencies().subscribe((data: any) => {
      this.currencies = data?.selectedCurrencyOptions || [];
      if (!this.limits.length && this.currencies.length) {
        this.addRow({ currencyCode: this.currencies[0].code });
      }
      this.changeDetector.markForCheck();
    });
  }

  addRow(limit: Partial<SelfServiceUserLimit> = {}) {
    this.limits.push(
      this.formBuilder.group(
        {
          currencyCode: [
            limit.currencyCode || '',
            Validators.required
          ],
          perTransferLimit: [
            limit.perTransferLimit ?? null,
            Validators.min(0.01)
          ],
          dailyLimit: [
            limit.dailyLimit ?? null,
            Validators.min(0.01)
          ]
        },
        { validators: limitRowValidator }
      )
    );
  }

  removeRow(index: number) {
    this.limits.removeAt(index);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const limits = this.limits.value.map((row: any) => ({
      currencyCode: row.currencyCode,
      perTransferLimit: row.perTransferLimit || null,
      dailyLimit: row.dailyLimit || null
    }));
    const reason = (this.form.value.reason || '').trim() || undefined;
    this.dialogRef.close({ limits, reason });
  }
}
