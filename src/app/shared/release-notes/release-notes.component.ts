/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogActions,
  MatDialogTitle,
  MatDialogContent,
  MatDialogClose
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatTab, MatTabGroup, MatTabLabel } from '@angular/material/tabs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RELEASE_NOTE_VERSION } from './release-notes.constants';
import { ReleaseNoteService } from './release-note.service';

/** How the release notes were opened. */
export type ReleaseNotesMode = 'login' | 'menu';

/** Data passed to the release notes modal. */
export interface ReleaseNotesDialogData {
  mode?: ReleaseNotesMode;
}

/** Result of the modal opened after login. */
export type ReleaseNotesResult = 'viewed' | 'save-failed' | undefined;

/**
 * Release notes modal.
 *
 * In "login" mode (opened on Home after login while the user has not read the notes) the only way out is "Got it",
 * which records that the user read this version. In "menu" mode (side menu) it only shows the notes.
 */
@Component({
  selector: 'mifosx-release-notes',
  templateUrl: './release-notes.component.html',
  styleUrls: ['./release-notes.component.scss'],
  standalone: true,
  imports: [
    DatePipe,
    FaIconComponent,
    MatButton,
    MatTabGroup,
    MatTab,
    MatTabLabel,
    MatDialogActions,
    MatDialogTitle,
    MatDialogContent,
    MatDialogClose
  ]
})
export class ReleaseNotesComponent implements OnInit {
  dialogRef = inject<MatDialogRef<ReleaseNotesComponent, ReleaseNotesResult>>(MatDialogRef);
  private data = inject<ReleaseNotesDialogData | null>(MAT_DIALOG_DATA, { optional: true });
  private releaseNoteService = inject(ReleaseNoteService);

  /** Version of the notes shown. */
  readonly version = RELEASE_NOTE_VERSION;
  /** When the user read the notes, shown in menu mode. */
  viewedOn: string | null = null;
  /** True while "Got it" is being saved. */
  saving = false;

  get isLoginMode(): boolean {
    return this.data?.mode === 'login';
  }

  ngOnInit(): void {
    if (!this.isLoginMode) {
      this.releaseNoteService.getStatus().subscribe({
        next: (status) => (this.viewedOn = status?.viewedOn ?? null),
        error: () => (this.viewedOn = null)
      });
    }
  }

  /** Records that the user read this version, then closes the modal. */
  gotIt(): void {
    if (this.saving) {
      return;
    }
    this.saving = true;
    this.releaseNoteService.markViewed(this.version).subscribe({
      next: () => this.dialogRef.close('viewed'),
      error: () => this.dialogRef.close('save-failed')
    });
  }
}
