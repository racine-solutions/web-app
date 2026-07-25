import { Component } from '@angular/core';
import {
  MatDialogRef,
  MatDialogActions,
  MatDialogTitle,
  MatDialogContent,
  MatDialogClose
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { inject } from '@angular/core';

@Component({
  selector: 'mifosx-release-notes',
  templateUrl: './release-notes.component.html',
  styleUrls: ['./release-notes.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    MatDialogActions,
    MatDialogTitle,
    MatDialogContent,
    MatDialogClose
  ]
})
export class ReleaseNotesComponent {
  dialogRef = inject(MatDialogRef<ReleaseNotesComponent>);
}
