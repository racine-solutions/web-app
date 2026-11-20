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
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/** Custom Models */
import { DeviceCommand, OfficerAppDevice, OfficerCommand } from '../officer-app.model';

export interface AccessDialogData {
  command: OfficerCommand | DeviceCommand;
  /** Officer name and username shown at the top. */
  officerName: string;
  username: string;
  /** For device commands. */
  device?: OfficerAppDevice;
  /** turnOff: how many of the officer's devices are not blocked yet. */
  activeDevices?: number;
}

interface CommandText {
  title: string;
  description: string;
  submit: string;
  reasonRequired: boolean;
  notify: boolean;
  danger: boolean;
}

/** Translation keys (labels.heading / labels.text / labels.buttons) per command. */
const COMMAND_TEXT: Record<OfficerCommand | DeviceCommand, CommandText> = {
  turnOff: {
    title: 'Turn Off Mobile App Access',
    description:
      'The officer is signed out of the field officer app on all devices and cannot sign in to it again until access is turned back on',
    submit: 'Turn Off Access',
    reasonRequired: true,
    notify: true,
    danger: true
  },
  turnOn: {
    title: 'Turn On Mobile App Access',
    description: 'The officer can sign in to the field officer app again. Blocked devices stay blocked',
    submit: 'Turn On Access',
    reasonRequired: true,
    notify: true,
    danger: false
  },
  signOutAll: {
    title: 'Sign Out of All Devices',
    description: 'Ends every open field officer app session of this officer; they can sign in again',
    submit: 'Sign Out All Devices',
    reasonRequired: false,
    notify: false,
    danger: false
  },
  unlock: {
    title: 'Unlock Account',
    description:
      'The user can sign in to the web app and the field officer app again. They are told by email, or by SMS when they have no email address',
    submit: 'Unlock',
    reasonRequired: false,
    notify: false,
    danger: false
  },
  block: {
    title: 'Block Device',
    description:
      'Nobody can use the field officer app on this device until it is unblocked, with any account. Open sessions on it end now',
    submit: 'Block Device',
    reasonRequired: true,
    notify: true,
    danger: true
  },
  unblock: {
    title: 'Unblock Device',
    description: 'The device can be used with the field officer app again',
    submit: 'Unblock Device',
    reasonRequired: false,
    notify: false,
    danger: false
  },
  signOut: {
    title: 'Sign Out Device',
    description: 'Ends the field officer app session on this device; the officer can sign in again',
    submit: 'Sign Out Device',
    reasonRequired: false,
    notify: false,
    danger: false
  }
};

/**
 * Asks for the reason and options of a field officer app access change and returns the request body, or nothing if
 * cancelled.
 */
@Component({
  selector: 'mifosx-officer-app-access-dialog',
  templateUrl: './access-dialog.component.html',
  styleUrls: ['./access-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose
  ]
})
export class AccessDialogComponent {
  data = inject<AccessDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AccessDialogComponent>);
  private formBuilder = inject(UntypedFormBuilder);

  text = COMMAND_TEXT[this.data.command];
  isTurnOff = this.data.command === 'turnOff';
  /** Commands the officer sees the reason of in the app. */
  reasonShownInApp = this.data.command === 'turnOff' || this.data.command === 'block';
  /** Turning access off or blocking a device never touches the web-app login. */
  webAppNote = this.data.command === 'turnOff' || this.data.command === 'block';

  form: UntypedFormGroup = this.formBuilder.group({
    reason: [
      '',
      this.text.reasonRequired ? [
            Validators.required,
            Validators.maxLength(500)
          ] : [Validators.maxLength(500)]
    ],
    blockDevices: [false],
    notify: [true]
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
    if (this.isTurnOff) {
      body['blockDevices'] = !!value.blockDevices;
    }
    if (this.text.notify) {
      body['notify'] = !!value.notify;
    }
    this.dialogRef.close(body);
  }
}
