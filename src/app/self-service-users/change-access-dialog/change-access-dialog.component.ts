/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/** Custom Models */
import { SelfServiceUser, SelfServiceUserCommand } from '../self-service-user.model';

export interface ChangeAccessDialogData {
  command: SelfServiceUserCommand;
  user: SelfServiceUser;
}

/** Commands that change the user's status and therefore need a reason. */
const REASON_REQUIRED: SelfServiceUserCommand[] = [
  'viewOnly',
  'suspend',
  'reactivate',
  'close'
];

/** Translation keys (labels.heading / labels.text) per command. */
const COMMAND_TEXT: Record<SelfServiceUserCommand, { title: string; description: string; submit: string }> = {
  viewOnly: {
    title: 'Make Mobile App Access View Only',
    description: 'The client can log in and see their accounts but every transfer, request or other change is refused',
    submit: 'Make View Only'
  },
  suspend: {
    title: 'Suspend Mobile App Access',
    description: 'The client cannot log in until the access is reactivated; open sessions end immediately',
    submit: 'Suspend'
  },
  reactivate: {
    title: 'Reactivate Mobile App Access',
    description: 'The client can log in and transact again',
    submit: 'Reactivate'
  },
  close: {
    title: 'Close Mobile App Access',
    description: 'The client loses mobile app access permanently; this cannot be undone',
    submit: 'Close Access'
  },
  unlock: {
    title: 'Unlock Mobile App User',
    description: 'Clears the lock set after too many failed logins; the access status does not change',
    submit: 'Unlock'
  },
  revokeSessions: {
    title: 'Sign Out Everywhere',
    description: 'Ends every open mobile app session of this client; the client can log in again',
    submit: 'Sign Out Everywhere'
  },
  resetPassword: {
    title: 'Reset Mobile App Password',
    description: 'Choose how the client sets a new password',
    submit: 'Reset Password'
  }
};

/**
 * Asks for the details of an access change (reason, options) and returns the request body, or nothing if cancelled.
 */
@Component({
  selector: 'mifosx-change-access-dialog',
  templateUrl: './change-access-dialog.component.html',
  styleUrls: ['./change-access-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatRadioGroup,
    MatRadioButton
  ]
})
export class ChangeAccessDialogComponent {
  data = inject<ChangeAccessDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ChangeAccessDialogComponent>);
  private formBuilder = inject(UntypedFormBuilder);

  text = COMMAND_TEXT[this.data.command];
  reasonRequired = REASON_REQUIRED.includes(this.data.command);
  isViewOnly = this.data.command === 'viewOnly';
  isResetPassword = this.data.command === 'resetPassword';
  isClose = this.data.command === 'close';

  form: UntypedFormGroup = this.formBuilder.group({
    reason: [
      '',
      this.reasonRequired ? [
            Validators.required,
            Validators.maxLength(500)
          ] : [Validators.maxLength(500)]
    ],
    revokeSessions: [true],
    method: ['sendLink']
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    const body: Record<string, unknown> = {};
    if (value.reason && value.reason.trim()) {
      body['reason'] = value.reason.trim();
    }
    if (this.isViewOnly) {
      body['revokeSessions'] = value.revokeSessions;
    }
    if (this.isResetPassword) {
      body['method'] = value.method;
    }
    this.dialogRef.close(body);
  }
}
