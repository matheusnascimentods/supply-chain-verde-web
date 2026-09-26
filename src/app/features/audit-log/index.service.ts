import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { AuditLogResponseDTO, auditLogResponseSchema } from './index.schema';
@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient); private readonly _logs = signal<AuditLogResponseDTO[]>([]); readonly logs = this._logs.asReadonly();
  load(): Observable<AuditLogResponseDTO[]> { return this.http.get<unknown>(`${environment.apiUrl}/audit-logs`).pipe(map((raw) => z.array(auditLogResponseSchema).parse(raw)), tap((items) => this._logs.set(items))); }
}
