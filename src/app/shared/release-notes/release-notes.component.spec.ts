import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faTags, faBug, faAnchor } from '@fortawesome/free-solid-svg-icons';

import { ReleaseNotesComponent } from './release-notes.component';

describe('ReleaseNotesComponent', () => {
  let component: ReleaseNotesComponent;
  let fixture: ComponentFixture<ReleaseNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleaseNotesComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faTags, faBug, faAnchor);

    fixture = TestBed.createComponent(ReleaseNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
