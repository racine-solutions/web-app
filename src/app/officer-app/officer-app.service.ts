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
  DeviceCommand,
  OfficerAppDevice,
  OfficerAppEvent,
  OfficerAppEventFilter,
  OfficerAppSummary,
  OfficerAppUser,
  OfficerCommand,
  Page
} from './officer-app.model';

export interface OfficerFilters {
  search?: string;
  officeId?: number;
  access?: string;
  online?: string;
  appVersion?: string;
  all?: boolean;
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: string;
}

export interface DeviceFilters {
  search?: string;
  officeId?: number;
  userId?: number;
  status?: string;
  signedIn?: boolean;
  appVersion?: string;
  offset?: number;
  limit?: number;
  sortOrder?: string;
}

/** Back-office API of the field officer app (Admin › Mobile Officer App). */
@Injectable({
  providedIn: 'root'
})
export class OfficerAppService {
  private http = inject(HttpClient);

  getSummary(officeId?: number): Observable<OfficerAppSummary> {
    return this.http.get<OfficerAppSummary>('/officerapp/summary', { params: toParams({ officeId }) });
  }

  getOfficers(filters: OfficerFilters): Observable<Page<OfficerAppUser>> {
    return this.http.get<Page<OfficerAppUser>>('/officerapp/officers', { params: toParams(filters) });
  }

  /** Works for any staff user in the admin's offices, also one who never used the app. */
  getOfficer(userId: number | string): Observable<OfficerAppUser> {
    return this.http.get<OfficerAppUser>(`/officerapp/officers/${userId}`);
  }

  getDevices(filters: DeviceFilters): Observable<Page<OfficerAppDevice>> {
    return this.http.get<Page<OfficerAppDevice>>('/officerapp/devices', { params: toParams(filters) });
  }

  /** Activity of one officer, or of every officer in scope when userId is null. Newest first. */
  getEvents(
    userId: number | null,
    filter: OfficerAppEventFilter,
    offset: number,
    limit: number
  ): Observable<Page<OfficerAppEvent>> {
    const params = toParams({ ...filter, offset, limit });
    const url = userId ? `/officerapp/officers/${userId}/events` : '/officerapp/events';
    return this.http.get<Page<OfficerAppEvent>>(url, { params });
  }

  /** Offices the staff member can see (their own and the ones under it). */
  getOffices(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string }[]>('/offices');
  }

  /** body: reason, blockDevices (turnOff), notify. */
  officerCommand(userId: number, command: OfficerCommand, body: Record<string, unknown>): Observable<any> {
    return this.http.post(`/officerapp/officers/${userId}`, body || {}, {
      params: new HttpParams().set('command', command)
    });
  }

  /** body: reason, notify (block). */
  deviceCommand(deviceId: number, command: DeviceCommand, body: Record<string, unknown>): Observable<any> {
    return this.http.post(`/officerapp/devices/${deviceId}`, body || {}, {
      params: new HttpParams().set('command', command)
    });
  }
}

function toParams(values: object): HttpParams {
  let params = new HttpParams();
  Object.entries(values || {}).forEach(
    ([
      key,
      value
    ]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
  );
  return params;
}
