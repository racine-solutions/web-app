import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { SystemService } from '../system.service';
import { TranslateModule } from '@ngx-translate/core';
import { AuthenticationService } from 'app/core/authentication/authentication.service';

import { SmsEventConfigurationComponent } from './sms-event-configuration.component';

describe('SmsEventConfigurationComponent', () => {
  let component: SmsEventConfigurationComponent;
  let fixture: ComponentFixture<SmsEventConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SmsEventConfigurationComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ smsEventConfiguration: [] })
          }
        },
        {
          provide: SystemService,
          useValue: {}
        },
        {
          provide: AuthenticationService,
          useValue: { getCredentials: () => ({}) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SmsEventConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
