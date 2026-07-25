import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SystemService } from '../../system.service';
import { SmsWalletTransactionsComponent } from './sms-wallet-transactions.component';

describe('SmsWalletTransactionsComponent', () => {
  let component: SmsWalletTransactionsComponent;
  let fixture: ComponentFixture<SmsWalletTransactionsComponent>;
  let systemService: { getSmsWalletTransactions: jest.Mock };

  const mockTransactionsPage = {
    totalFilteredRecords: 2,
    pageItems: [
      {
        id: 8,
        amount: 100,
        smsCost: 50,
        smsCredit: 2,
        previousBalance: 4017,
        note: 'Top-up received from Allan via Mobile Money',
        createdOnUtc: '2026-05-05T18:39:23Z'
      },
      {
        id: 7,
        amount: 100,
        smsCost: 50,
        smsCredit: 2,
        previousBalance: 4015,
        note: 'Top-up received from Allan via Mobile Money',
        createdOnUtc: '2026-05-05T18:39:15Z'
      }
    ]
  };

  beforeEach(async () => {
    systemService = {
      getSmsWalletTransactions: jest.fn().mockReturnValue(of(mockTransactionsPage))
    };

    await TestBed.configureTestingModule({
      imports: [SmsWalletTransactionsComponent],
      providers: [
        {
          provide: SystemService,
          useValue: systemService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SmsWalletTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load wallet transactions on init', () => {
    expect(systemService.getSmsWalletTransactions).toHaveBeenCalledWith(0, 10);
    expect(component.dataSource.data).toEqual(mockTransactionsPage.pageItems);
    expect(component.totalRows).toBe(2);
  });

  it('should load another page when paginator changes', () => {
    component.pageChanged({ pageIndex: 1, pageSize: 25, length: 2 } as any);

    expect(systemService.getSmsWalletTransactions).toHaveBeenLastCalledWith(25, 25);
  });

  it('should render wallet transactions table content', () => {
    const textContent = fixture.nativeElement.textContent;

    expect(textContent).toContain('Wallet Transactions');
    expect(textContent).toContain('Top-up received from Allan via Mobile Money');
    expect(textContent).toContain('SMS Credit');
    expect(textContent).not.toContain('SMS Cost');
    expect(component.displayedColumns).not.toContain('smsCost');
  });

  it('should handle request failure gracefully', () => {
    systemService.getSmsWalletTransactions.mockReturnValueOnce(throwError(() => new Error('failed')));

    component.loadWalletTransactions();

    expect(component.dataSource.data).toEqual([]);
    expect(component.totalRows).toBe(0);
    expect(component.isLoading).toBe(false);
  });
});
