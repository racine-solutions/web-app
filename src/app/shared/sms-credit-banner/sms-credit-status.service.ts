/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Lets any screen that changes an SMS setting ask the SMS banner to check again straight away, instead of waiting for
 * its next timed refresh.
 */
@Injectable({
  providedIn: 'root'
})
export class SmsCreditStatusService {
  private readonly refreshRequests = new Subject<void>();

  /** Emits each time the SMS status may have changed. */
  get refreshRequested(): Observable<void> {
    return this.refreshRequests.asObservable();
  }

  /** Call after saving anything that can switch SMS on or off or change its credit. */
  requestRefresh(): void {
    this.refreshRequests.next();
  }
}
