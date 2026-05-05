import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SystemService } from '../../system.service';
import { SmsMessagesComponent } from './sms-messages.component';

describe('SmsMessagesComponent', () => {
  let component: SmsMessagesComponent;
  let fixture: ComponentFixture<SmsMessagesComponent>;
  let systemService: { getSmsMessages: jest.Mock };

  const mockMessagesPage = {
    totalFilteredRecords: 2,
    pageItems: [
      {
        id: 20,
        message: 'A withdraw was made on your account.',
        number: '256785154434',
        senderid: 'Racine',
        smsResponse: '{"Status":"OK"}',
        smsTypeEnum: 'SAVINGS_WITHDRAW',
        hasPassed: true,
        createdOnUtc: '2026-04-27T13:44:56Z'
      },
      {
        id: 19,
        message: 'A Loan Repayment was made.',
        number: '256785154434',
        senderid: 'Racine',
        smsResponse: '{"Status":"OK"}',
        smsTypeEnum: 'LOAN_REPAYMENT',
        hasPassed: false,
        createdOnUtc: '2026-04-27T12:16:00Z'
      }
    ]
  };

  beforeEach(async () => {
    systemService = {
      getSmsMessages: jest.fn().mockReturnValue(of(mockMessagesPage))
    };

    await TestBed.configureTestingModule({
      imports: [SmsMessagesComponent],
      providers: [
        {
          provide: SystemService,
          useValue: systemService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SmsMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load messages on init', () => {
    expect(systemService.getSmsMessages).toHaveBeenCalledWith(0, 10);
    expect(component.dataSource.data).toEqual(mockMessagesPage.pageItems);
    expect(component.totalRows).toBe(2);
  });

  it('should load another page when paginator changes', () => {
    component.pageChanged({ pageIndex: 1, pageSize: 25, length: 2 } as any);

    expect(systemService.getSmsMessages).toHaveBeenLastCalledWith(25, 25);
  });

  it('should render messages table content', () => {
    const textContent = fixture.nativeElement.textContent;

    expect(textContent).toContain('Messages');
    expect(textContent).toContain('SAVINGS_WITHDRAW');
    expect(textContent).toContain('Sent');
  });

  it('should handle request failure gracefully', () => {
    systemService.getSmsMessages.mockReturnValueOnce(throwError(() => new Error('failed')));

    component.loadMessages();

    expect(component.dataSource.data).toEqual([]);
    expect(component.totalRows).toBe(0);
    expect(component.isLoading).toBe(false);
  });
});