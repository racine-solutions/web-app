/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { NgModule } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

/** Module Imports */
import { SharedModule } from '../shared/shared.module';
import { SystemRoutingModule } from './system-routing.module';
import { PipesModule } from '../pipes/pipes.module';
import { DirectivesModule } from '../directives/directives.module';

/** Component Imports */
import { CodesComponent } from './codes/codes.component';
import { SystemComponent } from './system.component';
import { CreateCodeComponent } from './codes/create-code/create-code.component';
import { ExternalServicesComponent } from './external-services/external-services.component';
import { ManageDataTablesComponent } from './manage-data-tables/manage-data-tables.component';
import { CreateDataTableComponent } from './manage-data-tables/create-data-table/create-data-table.component';
import { ViewDataTableComponent } from './manage-data-tables/view-data-table/view-data-table.component';
import { EditDataTableComponent } from './manage-data-tables/edit-data-table/edit-data-table.component';
import { ManageHooksComponent } from './manage-hooks/manage-hooks.component';
import { RolesAndPermissionsComponent } from './roles-and-permissions/roles-and-permissions.component';
import { AddRoleComponent } from './roles-and-permissions/add-role/add-role.component';
import { ManageSurveysComponent } from './manage-surveys/manage-surveys.component';
import { ViewSurveyComponent } from './manage-surveys/view-survey/view-survey.component';
import { CreateSurveyComponent } from './manage-surveys/create-survey/create-survey.component';
import { EditConfigurationComponent } from './configurations/global-configurations-tab/edit-configuration/edit-configuration.component';
import { AmazonS3Component } from './external-services/amazon-s3/amazon-s3.component';
import { EmailComponent } from './external-services/email/email.component';
import { SMSComponent } from './external-services/sms/sms.component';
import { NotificationComponent } from './external-services/notification/notification.component';
import { ViewCodeComponent } from './codes/view-code/view-code.component';
import { EditCodeComponent } from './codes/edit-code/edit-code.component';
import { AccountNumberPreferencesComponent } from './account-number-preferences/account-number-preferences.component';
import { CreateAccountNumberPreferenceComponent } from './account-number-preferences/create-account-number-preference/create-account-number-preference.component';
import { ViewAccountNumberPreferenceComponent } from './account-number-preferences/view-account-number-preference/view-account-number-preference.component';
import { EditAccountNumberPreferenceComponent } from './account-number-preferences/edit-account-number-preference/edit-account-number-preference.component';
import { ManageReportsComponent } from './manage-reports/manage-reports.component';
import { ViewReportComponent } from './manage-reports/view-report/view-report.component';
import { CreateReportComponent } from './manage-reports/create-report/create-report.component';
import { EditReportComponent } from './manage-reports/edit-report/edit-report.component';
import { AuditTrailsComponent } from './audit-trails/audit-trails.component';
import { ViewAuditComponent } from './audit-trails/view-audit/view-audit.component';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WorkflowJobsComponent } from './manage-jobs/workflow-jobs/workflow-jobs.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ManageExternalEventsComponent } from './manage-external-events/manage-external-events.component';
import { CobWorkflowComponent } from './manage-jobs/cob-workflow/cob-workflow.component';
import { LoanLockedComponent } from './manage-jobs/cob-workflow/loan-locked/loan-locked.component';
import { CustomParametersPopoverComponent } from './manage-jobs/scheduler-jobs/custom-parameters-popover/custom-parameters-popover.component';
import { CustomParametersTableComponent } from './manage-jobs/scheduler-jobs/custom-parameters-popover/custom-parameters-table/custom-parameters-table.component';
import { ErrorLogPopoverComponent } from './manage-jobs/scheduler-jobs/error-log-popover/error-log-popover.component';
import { RunSelectedJobsPopoverComponent } from './manage-jobs/scheduler-jobs/run-selected-jobs-popover/run-selected-jobs-popover.component';
import { RunSelectedJobsTableComponent } from './manage-jobs/scheduler-jobs/run-selected-jobs-popover/run-selected-jobs-table/run-selected-jobs-table.component';
import { PremiumFeatureComponent } from './premium-feature/premium-feature.component';
import { SmsMessagesComponent } from './premium-feature/sms/sms-messages.component';
import { PremiumFeatureSmsComponent } from './premium-feature/sms/premium-feature-sms.component';
import { SmsWalletTransactionsComponent } from './premium-feature/sms/sms-wallet-transactions.component';
import { SmsEventConfigurationComponent } from './sms-event-configuration/sms-event-configuration.component';
import { SystemInformationComponent } from './system-information/system-information.component';
import { AboutUsComponent } from './about-us/about-us.component';

@NgModule({
  imports: [
    SystemRoutingModule,
    SharedModule,
    PipesModule,
    NgxGraphModule,
    DragDropModule,
    DirectivesModule,
    RunSelectedJobsPopoverComponent,
    RunSelectedJobsTableComponent,
    PremiumFeatureComponent,
    SmsMessagesComponent,
    PremiumFeatureSmsComponent,
    SmsWalletTransactionsComponent,
    SmsEventConfigurationComponent,
    ManageExternalEventsComponent,
    CobWorkflowComponent,
    LoanLockedComponent,
    CustomParametersPopoverComponent,
    CustomParametersTableComponent,
    ErrorLogPopoverComponent,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatSlideToggleModule,
    SystemComponent,
    CodesComponent,
    ViewCodeComponent,
    CreateCodeComponent,
    EditCodeComponent,
    ExternalServicesComponent,
    ManageDataTablesComponent,
    CreateDataTableComponent,
    ViewDataTableComponent,
    EditDataTableComponent,
    ManageHooksComponent,
    ManageSurveysComponent,
    ViewSurveyComponent,
    CreateSurveyComponent,
    EditConfigurationComponent,
    AmazonS3Component,
    EmailComponent,
    SMSComponent,
    NotificationComponent,
    AccountNumberPreferencesComponent,
    CreateAccountNumberPreferenceComponent,
    ViewAccountNumberPreferenceComponent,
    EditAccountNumberPreferenceComponent,
    ManageReportsComponent,
    ViewReportComponent,
    CreateReportComponent,
    EditReportComponent,
    AuditTrailsComponent,
    ViewAuditComponent,
    RolesAndPermissionsComponent,
    AddRoleComponent,
    TranslateModule,
    ViewSchedulerJobComponent,
    EditSchedulerJobComponent,
    ViewRoleComponent,
    EditRoleComponent,
    EntityToEntityMappingComponent,
    ConfigureMakerCheckerTasksComponent,
    CreateSurveyComponent,
    EditSchedulerJobComponent,
    ViewHistorySchedulerJobComponent,
    ViewSurveyComponent,
    EditSurveyComponent,
    BusinessDateTabComponent,
    ConfigurationsComponent,
    GlobalConfigurationsTabComponent,
    ManageJobsComponent,
    ManageSchedulerJobsComponent,
    WorkflowJobsComponent,
    WorkflowDiagramComponent,
    ManageExternalEventsComponent,
    CobWorkflowComponent,
    LoanLockedComponent,
    CustomParametersPopoverComponent,
    CustomParametersTableComponent,
    ErrorLogPopoverComponent,
    RunSelectedJobsPopoverComponent,
    RunSelectedJobsTableComponent,
    SystemInformationComponent,
    AboutUsComponent
  ]
})
export class SystemModule {}
