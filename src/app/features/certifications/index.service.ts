import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CertificationRequestDTO,
  CertificationPageDTO,
  CertificationResponseDTO,
  CertificationStatus,
  certificationListResponseSchema,
  certificationResponseSchema,
  certificationStatusSchema,
} from './index.schema';

@Injectable({ providedIn: 'root' })
export class CertificationsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/certifications`;
  private readonly _certifications = signal<CertificationResponseDTO[]>([]);
  readonly certifications = this._certifications.asReadonly();

  load(status: CertificationStatus | null = null, page = 0): Observable<CertificationPageDTO> {
    const apiStatus = status
      ? status === 'underReview'
        ? 'UNDER_REVIEW'
        : status.toUpperCase()
      : undefined;
    return this.loadApiPage(page, 20, apiStatus).pipe(
      tap((response) => this._certifications.set(response.items)),
    );
  }

  private loadApiPage(
    page: number,
    size: number,
    status?: string,
  ): Observable<CertificationPageDTO> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http
      .get<unknown>(this.base, { params })
      .pipe(map((raw) => certificationListResponseSchema.parse(raw)));
  }

  create(supplierId: number, data: CertificationRequestDTO): Observable<CertificationResponseDTO> {
    return this.http
      .post<unknown>(`${environment.apiUrl}/suppliers/${supplierId}/certifications`, {
        supplierId,
        certification: data.name,
        issuingBody: data.issuingOrganization,
        issuedAt: data.issuedAt,
        expiresAt: data.expiresAt,
      })
      .pipe(map((raw) => certificationResponseSchema.parse(raw)));
  }

  updateStatus(id: number, status: CertificationStatus): Observable<CertificationResponseDTO> {
    const parsed = certificationStatusSchema.parse(status);
    const apiStatus = parsed === 'underReview' ? 'UNDER_REVIEW' : parsed.toUpperCase();
    return this.http
      .patch<unknown>(`${this.base}/${id}/status`, { status: apiStatus })
      .pipe(map((raw) => certificationResponseSchema.parse(raw)));
  }
}
