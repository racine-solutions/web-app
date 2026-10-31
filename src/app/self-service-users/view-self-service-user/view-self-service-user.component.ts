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
import { ActivityTimelineComponent } from '../activity-timeline/activity-timeline.component';
import { ChangeAccessDialogComponent } from '../change-access-dialog/change-access-dialog.component';
import { ClientsDialogComponent } from '../clients-dialog/clients-dialog.component';
import { LimitsDialogComponent } from '../limits-dialog/limits-dialog.component';
import {
  COMMAND_PERMISSIONS,
  SelfServiceUser,
  SelfServiceUserCommand,
  SelfServiceUserStatus,
  UPDATE_CLIENTS_PERMISSION,
  UPDATE_LIMITS_PERMISSION,
  availableCommands,
  statusSeverity
} from '../self-service-user.model';
import { SelfServiceUsersService } from '../self-service-users.service';

/** Profile of one mobile app (self-service) user, with the access changes staff may make. */
@Component({
  selector: 'mifosx-view-self-service-user',
  templateUrl: './view-self-service-user.component.html',
  styleUrls: ['./view-self-service-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    RouterLink,
    ActivityTimelineComponent
  ]
})
export class ViewSelfServiceUserComponent {
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private service = inject(SelfServiceUsersService);
  private changeDetector = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly commandPermissions = COMMAND_PERMISSIONS;
  readonly updateLimitsPermission = UPDATE_LIMITS_PERMISSION;
  readonly updateClientsPermission = UPDATE_CLIENTS_PERMISSION;
  user: SelfServiceUser;
  commands: SelfServiceUserCommand[] = [];
  severity = '';
  isClosed = false;
  /** Bumped on every reload so the activity timeline shows the change just made. */
  refreshCount = 0;

  constructor() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: { user: SelfServiceUser }) => {
      this.setUser(data.user);
    });
  }

  runCommand(command: SelfServiceUserCommand) {
    this.dialog
      .open(ChangeAccessDialogComponent, { data: { command, user: this.user } })
      .afterClosed()
      .subscribe((body) => {
        if (!body) {
          return;
        }
        this.service.executeCommand(this.user.id, command, body).subscribe(() => this.reload());
      });
  }

  editLimits() {
    this.dialog
      .open(LimitsDialogComponent, { data: { user: this.user } })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.service.updateLimits(this.user.id, result.limits, result.reason).subscribe(() => this.reload());
        }
      });
  }

  editClients() {
    this.dialog
      .open(ClientsDialogComponent, { data: { user: this.user } })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.service.updateClients(this.user.id, result.clientIds, result.reason).subscribe(() => this.reload());
        }
      });
  }

  private reload() {
    this.service.getUser(this.user.id).subscribe((user) => this.setUser(user));
  }

  private setUser(user: SelfServiceUser) {
    this.user = user;
    this.commands = availableCommands(user);
    this.severity = statusSeverity(user);
    this.isClosed = user?.status?.id === SelfServiceUserStatus.Closed;
    this.refreshCount++;
    this.changeDetector.markForCheck();
  }
}
