/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/** Angular Imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/** Custom Imports */
import { AccessDialogComponent, AccessDialogData } from '../access-dialog/access-dialog.component';
import {
  OFFICER_COMMAND_PERMISSIONS,
  OfficerAppUser,
  OfficerCommand,
  onlineLabel,
  onlineSeverity
} from '../officer-app.model';
import { OfficerAppService } from '../officer-app.service';

/**
 * "Mobile Officer App" card on the staff user page (Admin › Users): app access, devices and last use, with the
 * turn off / turn on button. Shown only to staff who may read officer app data.
 */
@Component({
  selector: 'mifosx-user-officer-app-access',
  templateUrl: './user-officer-app-access.component.html',
  styleUrls: ['./user-officer-app-access.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    RouterLink
  ]
})
export class UserOfficerAppAccessComponent implements OnChanges {
  private service = inject(OfficerAppService);
  private dialog = inject(MatDialog);
  private changeDetector = inject(ChangeDetectorRef);

  @Input() userId: number;

  readonly permissions = OFFICER_COMMAND_PERMISSIONS;
  readonly onlineSeverity = onlineSeverity;
  readonly onlineLabel = onlineLabel;
  officer: OfficerAppUser | null = null;

  ngOnChanges() {
    this.load();
  }

  get toggleCommand(): OfficerCommand {
    return this.officer?.accessStatus === 'OFF' ? 'turnOn' : 'turnOff';
  }

  toggle() {
    const officer = this.officer;
    const command = this.toggleCommand;
    const data: AccessDialogData = {
      command,
      officerName: officer.displayName,
      username: officer.username,
      activeDevices: officer.devices - officer.blockedDevices
    };
    this.dialog
      .open(AccessDialogComponent, { data })
      .afterClosed()
      .subscribe((body) => {
        if (body) {
          this.service.officerCommand(officer.userId, command, body).subscribe(() => this.load());
        }
      });
  }

  private load() {
    if (!this.userId) {
      return;
    }
    // No permission or not in the admin's offices: the card stays hidden
    this.service.getOfficer(this.userId).subscribe({
      next: (officer) => {
        this.officer = officer;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.officer = null;
        this.changeDetector.markForCheck();
      }
    });
  }
}
