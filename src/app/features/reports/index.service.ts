import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { ReportPageDTO, ReportRequestDTO, ReportResponseDTO, reportPageSchema, reportResponseSchema } from './index.schema';
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient); private readonly _reports = signal<ReportResponseDTO[]>([]); readonly reports = this._reports.asReadonly();
  loadPage(params: { limit?: number; offset?: number } = {}): Observable<ReportPageDTO> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    return this.http.get<unknown>(`${environment.apiUrl}/reports`, {
      params: { limit: String(limit), offset: String(offset) },
    }).pipe(
      map((raw) => {
        const parsed = reportPageSchema.safeParse(raw);
        if (parsed.success) return parsed.data;
        if (typeof raw === 'object' && raw !== null && 'content' in raw) {
          const response = raw as { content: unknown; hasNext?: unknown; totalPages?: unknown };
          return {
            items: z.array(reportResponseSchema).parse(response.content),
            limit,
            offset,
            hasNext: response.hasNext === true,
            totalPages: typeof response.totalPages === 'number' ? response.totalPages : 0,
          };
        }
        if (Array.isArray(raw)) {
          const items = z.array(reportResponseSchema).parse(raw);
          return { items, limit, offset, hasNext: items.length === limit, totalPages: items.length === 0 ? 0 : 1 };
        }
        throw parsed.error;
      }),
      tap((page) => this._reports.set(page.items)),
    );
  }
  get(reportId: number): Observable<ReportResponseDTO> {
    return this.http.get<unknown>(`${environment.apiUrl}/reports`, {
      params: { reportId: String(reportId) },
    }).pipe(
      map((raw) => reportResponseSchema.parse(raw)),
    );
  }
  load(supplierId: number): Observable<ReportResponseDTO[]> { return this.http.get<unknown>(`${environment.apiUrl}/suppliers/${supplierId}/reports`).pipe(map((raw) => z.array(reportResponseSchema).parse(raw)), tap((items) => this._reports.set(items))); }
  generate(supplierId: number, data: ReportRequestDTO): Observable<ReportResponseDTO> { return this.http.post<unknown>(`${environment.apiUrl}/suppliers/${supplierId}/reports`, data).pipe(map((raw) => reportResponseSchema.parse(raw))); }
}
