/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/** Angular Imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/** Custom Imports */
import { AccessDialogComponent, AccessDialogData } from '../access-dialog/access-dialog.component';
import { OfficerActivityComponent } from '../officer-activity/officer-activity.component';
import {
  DEVICE_COMMAND_PERMISSIONS,
  DeviceCommand,
  OFFICER_COMMAND_PERMISSIONS,
  OfficerAppDevice,
  OfficerAppUser,
  OfficerCommand,
  deviceCommands,
  officerCommands,
  onlineLabel,
  onlineSeverity
} from '../officer-app.model';
import { OfficerAppService } from '../officer-app.service';

/** One staff user's field officer app access: devices, 30-day figures, access changes and activity. */
@Component({
  selector: 'mifosx-view-officer',
  templateUrl: './view-officer.component.html',
  styleUrls: ['./view-officer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    RouterLink,
    OfficerActivityComponent
  ]
})
export class ViewOfficerComponent {
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private service = inject(OfficerAppService);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly officerPermissions = OFFICER_COMMAND_PERMISSIONS;
  readonly devicePermissions = DEVICE_COMMAND_PERMISSIONS;
  readonly deviceCommands = deviceCommands;
  readonly onlineSeverity = onlineSeverity;
  readonly onlineLabel = onlineLabel;

  user: OfficerAppUser;
  commands: OfficerCommand[] = [];
  /** Bumped on every reload so the timeline shows the change just made. */
  refreshCount = 0;

  constructor() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: { officer: OfficerAppUser }) => {
      this.setUser(data.officer);
    });
  }

  runCommand(command: OfficerCommand) {
    const data: AccessDialogData = {
      command,
      officerName: this.user.displayName,
      username: this.user.username,
      activeDevices: this.user.devices - this.user.blockedDevices
    };
    this.dialog
      .open(AccessDialogComponent, { data })
      .afterClosed()
      .subscribe((body) => {
        if (body) {
          this.service.officerCommand(this.user.userId, command, body).subscribe(() => this.reload());
        }
      });
  }

  runDeviceCommand(device: OfficerAppDevice, command: DeviceCommand) {
    const data: AccessDialogData = {
      command,
      officerName: this.user.displayName,
      username: this.user.username,
      device
    };
    this.dialog
      .open(AccessDialogComponent, { data })
      .afterClosed()
      .subscribe((body) => {
        if (body) {
          this.service.deviceCommand(device.id, command, body).subscribe(() => this.reload());
        }
      });
  }

  private reload() {
    this.service.getOfficer(this.user.userId).subscribe((user) => this.setUser(user));
  }

  private setUser(user: OfficerAppUser) {
    this.user = user;
    this.commands = officerCommands(user);
    this.refreshCount++;
    this.changeDetector.markForCheck();
  }
}
