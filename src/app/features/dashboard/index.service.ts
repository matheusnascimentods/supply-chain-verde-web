import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummaryResponse, dashboardSummaryResponseSchema } from './index.schema';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/dashboard/summary`;

  loadSummary(limit = 10): Observable<DashboardSummaryResponse> {
    const params = new HttpParams().set('limit', limit);
    return this.http
      .get<unknown>(this.endpoint, { params })
      .pipe(map((response) => dashboardSummaryResponseSchema.parse(response)));
  }
}
