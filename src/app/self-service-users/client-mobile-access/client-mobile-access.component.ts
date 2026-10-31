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
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/** Custom Imports */
import { SelfServiceUser, statusSeverity } from '../self-service-user.model';
import { SelfServiceUsersService } from '../self-service-users.service';

/** "Mobile app access" panel on the client page: whether the client uses the app, and their access status. */
@Component({
  selector: 'mifosx-client-mobile-access',
  templateUrl: './client-mobile-access.component.html',
  styleUrls: ['./client-mobile-access.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    RouterLink
  ]
})
export class ClientMobileAccessComponent implements OnChanges {
  private service = inject(SelfServiceUsersService);
  private changeDetector = inject(ChangeDetectorRef);

  @Input() clientId: number;

  user: SelfServiceUser | null = null;
  severity = '';
  loaded = false;

  ngOnChanges() {
    if (!this.clientId) {
      return;
    }
    this.service.getUsers({ clientId: this.clientId, limit: 1 }).subscribe({
      next: (page) => {
        this.user = page.pageItems?.length ? page.pageItems[0] : null;
        this.severity = this.user ? statusSeverity(this.user) : '';
        this.loaded = true;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loaded = false;
        this.changeDetector.markForCheck();
      }
    });
  }
}
