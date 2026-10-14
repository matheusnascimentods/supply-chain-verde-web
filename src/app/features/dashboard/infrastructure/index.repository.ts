import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardSummary, MonthRange, MonthlyEmission } from '../domain/index.model';
import { dashboardSummaryResponseSchema, monthlyEmissionsResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class DashboardRepository {
  private readonly http = inject(HttpClient);

  loadSummary(limit: number): Observable<DashboardSummary> {
    return this.http
      .get<unknown>(`${environment.apiUrl}/dashboard/summary`, { params: { limit: String(limit) } })
      .pipe(map((response) => dashboardSummaryResponseSchema.parse(response)));
  }

  /** Série mensal no escopo do usuário: a cadeia inteira ou, para `supplier`, só o próprio fornecedor. */
  loadEmissions(range: MonthRange): Observable<MonthlyEmission[]> {
    return this.http
      .get<unknown>(`${environment.apiUrl}/dashboard/emissions`, { params: { ...range } })
      .pipe(map((response) => monthlyEmissionsResponseSchema.parse(response)));
  }
}
