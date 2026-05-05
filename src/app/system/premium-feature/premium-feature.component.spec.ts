import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PremiumFeatureComponent } from './premium-feature.component';

describe('PremiumFeatureComponent', () => {
  let component: PremiumFeatureComponent;
  let fixture: ComponentFixture<PremiumFeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremiumFeatureComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(PremiumFeatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});