import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { CertificationRequestDTO, CertificationResponseDTO, certificationResponseSchema, certificationStatusSchema } from './index.schema';
@Injectable({ providedIn: 'root' })
export class CertificationsService {
  private readonly http = inject(HttpClient); private readonly base = `${environment.apiUrl}/certifications`;
  private readonly _certifications = signal<CertificationResponseDTO[]>([]); readonly certifications = this._certifications.asReadonly();
  load(expiring = false): Observable<CertificationResponseDTO[]> { const url = expiring ? `${this.base}/expiring` : this.base; return this.http.get<unknown>(url).pipe(map((raw) => z.array(certificationResponseSchema).parse(raw)), tap((items) => this._certifications.set(items))); }
  create(supplierId: number, data: CertificationRequestDTO): Observable<CertificationResponseDTO> { return this.http.post<unknown>(`${environment.apiUrl}/suppliers/${supplierId}/certifications`, data).pipe(map((raw) => certificationResponseSchema.parse(raw))); }
  updateStatus(id: number, status: string): Observable<CertificationResponseDTO> { const parsed = certificationStatusSchema.parse(status); return this.http.patch<unknown>(`${this.base}/${id}/status`, { status: parsed }).pipe(map((raw) => certificationResponseSchema.parse(raw))); }
}
