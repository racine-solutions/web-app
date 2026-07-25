import { TestBed } from '@angular/core/testing';
import { SmsEventConfigurationResolver } from './sms.event.configuration.resolver';
import { SystemService } from '../system.service';

describe('SmsEventConfigurationResolver', () => {
  let resolver: SmsEventConfigurationResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SmsEventConfigurationResolver,
        { provide: SystemService, useValue: {} }]
    });
    resolver = TestBed.inject(SmsEventConfigurationResolver);
  });

  it('should create an instance', () => {
    expect(resolver).toBeTruthy();
  });
});
