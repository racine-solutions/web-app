import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PremiumFeatureSmsComponent } from './premium-feature-sms.component';
import { SmsAccount } from './sms-account.model';

describe('PremiumFeatureSmsComponent', () => {
  let component: PremiumFeatureSmsComponent;
  let fixture: ComponentFixture<PremiumFeatureSmsComponent>;

  const mockSmsAccount: SmsAccount = {
    id: 1,
    totalPaymentAmount: 1,
    smsTotalCredit: 1,
    smsTotalBalance: 1,
    isActive: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremiumFeatureSmsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ smsAccount: mockSmsAccount })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PremiumFeatureSmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sms account details from route data', () => {
    expect(component.smsAccount).toEqual(mockSmsAccount);
    expect(component.accountStatusLabel).toBe('Active');
  });

  it('should render the sms account card and event configuration menu', () => {
    const textContent = fixture.nativeElement.textContent;

    expect(textContent).toContain('SMS Account');
    expect(textContent).toContain('Active');
    expect(textContent).toContain('SMS Event Configuration');
    expect(textContent).toContain('Messages');
  });
});
