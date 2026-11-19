/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Release-note status of the logged-in user. */
export interface ReleaseNoteStatus {
  version: string | null;
  viewedReleaseNote: boolean;
  viewedOn: string | null;
}

/**
 * Reads and records whether the logged-in user has read the release notes.
 */
@Injectable({ providedIn: 'root' })
export class ReleaseNoteService {
  private http = inject(HttpClient);

  /** The current release-note version, whether the user has read it, and when. */
  getStatus(): Observable<ReleaseNoteStatus> {
    return this.http.get<ReleaseNoteStatus>('/releasenote');
  }

  /** Records that the user has read the given version. */
  markViewed(version: string): Observable<ReleaseNoteStatus> {
    return this.http.put<ReleaseNoteStatus>('/releasenote/viewed', { version });
  }
}
