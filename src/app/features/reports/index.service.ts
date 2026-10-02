import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReportPageDTO, ReportRequestDTO, ReportResponseDTO, reportPageSchema, reportResponseSchema } from './index.schema';
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  loadBySupplier(supplierId: number, params: { limit?: number; offset?: number } = {}): Observable<ReportPageDTO> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    return this.http.get<unknown>(`${environment.apiUrl}/reports`, {
      params: { supplierId: String(supplierId), limit: String(limit), offset: String(offset) },
    }).pipe(map((raw) => reportPageSchema.parse(raw)));
  }
  generate(supplierId: number, data: ReportRequestDTO): Observable<ReportResponseDTO> { return this.http.post<unknown>(`${environment.apiUrl}/suppliers/${supplierId}/reports`, data).pipe(map((raw) => reportResponseSchema.parse(raw))); }
}
