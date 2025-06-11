import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsEventConfigurationComponent } from './sms-event-configuration.component';

describe('SmsEventConfigurationComponent', () => {
  let component: SmsEventConfigurationComponent;
  let fixture: ComponentFixture<SmsEventConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SmsEventConfigurationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SmsEventConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
