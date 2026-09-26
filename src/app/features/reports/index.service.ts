import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { ReportRequestDTO, ReportResponseDTO, reportResponseSchema } from './index.schema';
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient); private readonly _reports = signal<ReportResponseDTO[]>([]); readonly reports = this._reports.asReadonly();
  load(supplierId: number): Observable<ReportResponseDTO[]> { return this.http.get<unknown>(`${environment.apiUrl}/suppliers/${supplierId}/reports`).pipe(map((raw) => z.array(reportResponseSchema).parse(raw)), tap((items) => this._reports.set(items))); }
  generate(supplierId: number, data: ReportRequestDTO): Observable<ReportResponseDTO> { return this.http.post<unknown>(`${environment.apiUrl}/suppliers/${supplierId}/reports`, data).pipe(map((raw) => reportResponseSchema.parse(raw))); }
}
