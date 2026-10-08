import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuditLogFilters, AuditLogPage } from '../domain/index.model';
import { auditLogPageSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class AuditLogRepository {
  private readonly http = inject(HttpClient);

  load(filters: AuditLogFilters, page: { limit: number; offset: number }): Observable<AuditLogPage> {
    const email = filters.email.trim();
    const params = {
      from: filters.startDate,
      to: filters.endDate,
      limit: String(page.limit),
      offset: String(page.offset),
      ...(filters.action ? { action: filters.action } : {}),
      ...(email ? { userEmail: email } : {}),
    };
    return this.http.get<unknown>(`${environment.apiUrl}/audit-logs`, { params }).pipe(
      map((raw) => {
        const result = auditLogPageSchema.parse(raw);
        return { items: result.items, hasNext: result.hasNext, totalPages: result.totalPages };
      }),
    );
  }
}
