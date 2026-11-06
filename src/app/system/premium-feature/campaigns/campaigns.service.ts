/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AudienceClientPage,
  AudienceCount,
  AudienceFilter,
  AudienceOptions,
  Campaign,
  CampaignRun,
  CommTemplate,
  DeliveryPage,
  MarketingConsent,
  MessageCheck,
  Paged,
  Placeholder
} from './campaigns.model';

/** Calls for communication templates, audiences, campaigns and marketing consent. */
@Injectable({
  providedIn: 'root'
})
export class CampaignsService {
  private http = inject(HttpClient);

  getTemplates(archived = false, offset = 0, limit = 25): Observable<Paged<CommTemplate>> {
    return this.http.get<Paged<CommTemplate>>('/comm/templates', {
      params: new HttpParams().set('archived', String(archived)).set('offset', offset).set('limit', limit)
    });
  }

  getTemplate(id: number): Observable<CommTemplate> {
    return this.http.get<CommTemplate>(`/comm/templates/${id}`);
  }

  getPlaceholders(): Observable<Placeholder[]> {
    return this.http.get<Placeholder[]>('/comm/templates/placeholders');
  }

  getTags(): Observable<string[]> {
    return this.http.get<string[]>('/comm/templates/tags');
  }

  preview(body: { text?: string; templateId?: number; clientId?: number }): Observable<MessageCheck> {
    return this.http.post<MessageCheck>('/comm/templates/preview', body);
  }

  saveTemplate(template: Partial<CommTemplate>, id?: number): Observable<any> {
    return id ? this.http.put(`/comm/templates/${id}`, template) : this.http.post('/comm/templates', template);
  }

  archiveTemplate(id: number): Observable<any> {
    return this.http.delete(`/comm/templates/${id}`);
  }

  getAudienceOptions(): Observable<AudienceOptions> {
    return this.http.get<AudienceOptions>('/comm/audiences/template');
  }

  countAudience(audience: AudienceFilter[], purpose: string): Observable<AudienceCount> {
    return this.http.post<AudienceCount>('/comm/audiences/count', { audience, purpose });
  }

  /** One page of the matching clients; show is ALL, RECIPIENTS or SKIPPED. */
  audienceClients(
    audience: AudienceFilter[],
    purpose: string,
    query: { show: string; search?: string; offset: number; limit: number }
  ): Observable<AudienceClientPage> {
    return this.http.post<AudienceClientPage>('/comm/audiences/clients', { audience, purpose, ...query });
  }

  getCampaigns(status: string | undefined, offset = 0, limit = 25): Observable<Paged<Campaign>> {
    let params = new HttpParams().set('offset', offset).set('limit', limit);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Paged<Campaign>>('/comm/campaigns', { params });
  }

  getCampaign(id: number): Observable<Campaign> {
    return this.http.get<Campaign>(`/comm/campaigns/${id}`);
  }

  saveCampaign(campaign: any, id?: number): Observable<any> {
    return id ? this.http.put(`/comm/campaigns/${id}`, campaign) : this.http.post('/comm/campaigns', campaign);
  }

  act(id: number, command: string, body: any = {}): Observable<any> {
    return this.http.post(`/comm/campaigns/${id}`, body, { params: new HttpParams().set('command', command) });
  }

  getRuns(id: number): Observable<CampaignRun[]> {
    return this.http.get<CampaignRun[]>(`/comm/campaigns/${id}/runs`);
  }

  getRun(id: number, runId: number): Observable<CampaignRun> {
    return this.http.get<CampaignRun>(`/comm/campaigns/${id}/runs/${runId}`);
  }

  getDeliveries(
    id: number,
    runId: number,
    filters: { status?: string; reason?: string; offset?: number; limit?: number }
  ): Observable<DeliveryPage> {
    let params = new HttpParams();
    Object.entries(filters).forEach(
      ([
        key,
        value
      ]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      }
    );
    return this.http.get<DeliveryPage>(`/comm/campaigns/${id}/runs/${runId}/deliveries`, { params });
  }

  retry(id: number, runId: number, deliveryIds?: number[]): Observable<any> {
    return this.http.post(
      `/comm/campaigns/${id}/runs/${runId}`,
      { deliveryIds: deliveryIds || [] },
      { params: new HttpParams().set('command', 'retry') }
    );
  }

  getConsent(clientId: number): Observable<MarketingConsent> {
    return this.http.get<MarketingConsent>(`/comm/clients/${clientId}/marketingconsent`);
  }

  saveConsent(clientId: number, receivesMarketing: boolean, note?: string): Observable<any> {
    return this.http.put(`/comm/clients/${clientId}/marketingconsent`, { receivesMarketing, note });
  }
}
