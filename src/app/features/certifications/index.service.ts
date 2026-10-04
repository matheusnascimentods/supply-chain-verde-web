import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CertificationRequestDTO,
  CertificationResponseDTO,
  CertificationStatus,
  certificationResponseSchema,
  certificationStatusSchema,
} from './index.schema';

@Injectable({ providedIn: 'root' })
export class CertificationsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/certifications`;
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
