import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PremiumFeatureSmsComponent } from './premium-feature-sms.component';

describe('PremiumFeatureSmsComponent', () => {
  let component: PremiumFeatureSmsComponent;
  let fixture: ComponentFixture<PremiumFeatureSmsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremiumFeatureSmsComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(PremiumFeatureSmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});