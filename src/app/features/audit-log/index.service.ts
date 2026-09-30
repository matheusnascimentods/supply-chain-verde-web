import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, concatMap, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLogPageDTO, auditLogPageSchema } from './index.schema';

export interface AuditLogFilters {
  startDate: string;
  endDate: string;
  action?: string;
  email?: string;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);

  load(filters: AuditLogFilters): Observable<AuditLogPageDTO> {
    let params = new HttpParams()
      .set('from', filters.startDate)
      .set('to', filters.endDate)
      .set('limit', '20')
      .set('offset', String(filters.offset ?? 0));
    if (filters.action) params = params.set('action', filters.action);
    if (filters.email?.trim()) params = params.set('userEmail', filters.email.trim());

    return this.http.get<unknown>(`${environment.apiUrl}/audit-logs`, { params }).pipe(
      map((raw) => {
        const parsed = auditLogPageSchema.safeParse(raw);
        if (parsed.success) return parsed.data;
        // This endpoint returns a plain array. Keep the actual API records visible
        // even if it adds a field/type not represented in the local schema yet.
        if (Array.isArray(raw)) {
          return {
            content: raw as AuditLogPageDTO['content'],
            hasNext: raw.length === 20,
          };
        }
        throw parsed.error;
      }),
    );
  }

  loadAll(filters: Omit<AuditLogFilters, 'offset'>): Observable<AuditLogPageDTO['content']> {
    const loadPage = (offset: number): Observable<AuditLogPageDTO['content']> => {
      console.info('[Auditoria CSV] Solicitando página à API.', { offset });
      return this.load({ ...filters, offset }).pipe(
        concatMap((page) => {
          console.info('[Auditoria CSV] Página recebida da API.', {
            offset,
            count: page.content.length,
            hasNext: page.hasNext,
          });
          return page.hasNext
            ? loadPage(offset + 20).pipe(map((next) => [...page.content, ...next]))
            : of(page.content);
        }),
      );
    };
    return loadPage(0);
  }
}
