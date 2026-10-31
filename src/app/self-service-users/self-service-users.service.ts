/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

/** rxjs Imports */
import { Observable } from 'rxjs';

/** Custom Models */
import {
  SelfServiceAdoptionReport,
  SelfServiceFunnelReport,
  SelfServiceTransactionsReport,
  SelfServiceUser,
  SelfServiceUserCommand,
  SelfServiceUserEventFilter,
  SelfServiceUserEventPage,
  SelfServiceUserLimit,
  SelfServiceUserPage,
  SelfServiceUserSummary
} from './self-service-user.model';

export interface SelfServiceUserFilters {
  search?: string;
  status?: number;
  locked?: boolean;
  officeId?: number;
  clientId?: number;
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: string;
}

/**
 * Back-office API for self-service (mobile app) users. Results are limited by the server to the staff member's office
 * and its child offices.
 */
@Injectable({
  providedIn: 'root'
})
export class SelfServiceUsersService {
  private http = inject(HttpClient);

  getUsers(filters: SelfServiceUserFilters): Observable<SelfServiceUserPage> {
    let params = new HttpParams();
    Object.entries(filters || {}).forEach(
      ([
        key,
        value
      ]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      }
    );
    return this.http.get<SelfServiceUserPage>('/selfserviceusers', { params });
  }

  getSummary(officeId?: number): Observable<SelfServiceUserSummary> {
    let params = new HttpParams();
    if (officeId) {
      params = params.set('officeId', String(officeId));
    }
    return this.http.get<SelfServiceUserSummary>('/selfserviceusers/summary', { params });
  }

  getUser(userId: number | string): Observable<SelfServiceUser> {
    return this.http.get<SelfServiceUser>(`/selfserviceusers/${userId}`);
  }

  /** The user's activity timeline, newest first. */
  getEvents(
    userId: number,
    filter: SelfServiceUserEventFilter,
    offset: number,
    limit: number
  ): Observable<SelfServiceUserEventPage> {
    let params = new HttpParams().set('offset', String(offset)).set('limit', String(limit));
    if (filter?.category) {
      params = params.set('category', filter.category);
    }
    if (filter?.result) {
      params = params.set('result', filter.result);
    }
    return this.http.get<SelfServiceUserEventPage>(`/selfserviceusers/${userId}/events`, { params });
  }

  /** Offices the staff member can see (their own and the ones under it). */
  getOffices(): Observable<{ id: number; name: string; hierarchy: string }[]> {
    return this.http.get<{ id: number; name: string; hierarchy: string }[]>('/offices');
  }

  getAdoptionReport(officeId: number | null, months: number): Observable<SelfServiceAdoptionReport> {
    return this.http.get<SelfServiceAdoptionReport>('/selfservicereports/adoption', {
      params: this.reportParams(officeId, { months: String(months) })
    });
  }

  getFunnelReport(officeId: number | null, fromDate: string, toDate: string): Observable<SelfServiceFunnelReport> {
    return this.http.get<SelfServiceFunnelReport>('/selfservicereports/funnel', {
      params: this.reportParams(officeId, { fromDate, toDate })
    });
  }

  getTransactionsReport(
    officeId: number | null,
    fromDate: string,
    toDate: string
  ): Observable<SelfServiceTransactionsReport> {
    return this.http.get<SelfServiceTransactionsReport>('/selfservicereports/transactions', {
      params: this.reportParams(officeId, { fromDate, toDate })
    });
  }

  private reportParams(officeId: number | null, values: Record<string, string>): HttpParams {
    let params = new HttpParams();
    if (officeId) {
      params = params.set('officeId', String(officeId));
    }
    Object.entries(values).forEach(
      ([
        key,
        value
      ]) => {
        if (value) {
          params = params.set(key, value);
        }
      }
    );
    return params;
  }

  /** Replaces the user's transfer limits. An empty list removes them. */
  updateLimits(userId: number, limits: Partial<SelfServiceUserLimit>[], reason?: string): Observable<any> {
    return this.http.put(`/selfserviceusers/${userId}/limits`, { limits, reason });
  }

  /** Replaces the clients the user acts for. */
  updateClients(userId: number, clientIds: number[], reason?: string): Observable<any> {
    return this.http.put(`/selfserviceusers/${userId}/clients`, { clientIds, reason });
  }

  /** Runs an access change. body: reason, revokeSessions (viewOnly), method (resetPassword: sendLink | forceChange). */
  executeCommand(userId: number, command: SelfServiceUserCommand, body: Record<string, unknown>): Observable<any> {
    const params = new HttpParams().set('command', command);
    return this.http.post(`/selfserviceusers/${userId}`, body || {}, { params });
  }
}
