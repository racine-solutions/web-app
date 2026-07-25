import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons';

import { PremiumFeatureComponent } from './premium-feature.component';

describe('PremiumFeatureComponent', () => {
  let component: PremiumFeatureComponent;
  let fixture: ComponentFixture<PremiumFeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremiumFeatureComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faWallet);

    fixture = TestBed.createComponent(PremiumFeatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
