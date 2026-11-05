import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Certification, CertificationStatus, NewCertification } from '../domain/index.model';
import { certificationPageSchema, certificationResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class CertificationsRepository {
  private readonly http = inject(HttpClient);

  /** `GET /certifications`: para a companhia fornecedora, a API devolve só as certificações dela. */
  load(params: { page: number; size: number }): Observable<{ items: Certification[]; totalPages: number }> {
    return this.http
      .get<unknown>(`${environment.apiUrl}/certifications`, { params: { page: String(params.page), size: String(params.size) } })
      .pipe(
        map((raw) => {
          const page = certificationPageSchema.parse(raw);
          return { items: page.content, totalPages: page.totalPages };
        }),
      );
  }

  create(supplierId: number, certification: NewCertification): Observable<Certification> {
    return this.http
      .post<unknown>(`${environment.apiUrl}/suppliers/${supplierId}/certifications`, certification)
      .pipe(map((raw) => certificationResponseSchema.parse(raw)));
  }

  updateStatus(certificationId: number, status: CertificationStatus): Observable<Certification> {
    return this.http
      .patch<unknown>(`${environment.apiUrl}/certifications/${certificationId}/status`, { status })
      .pipe(map((raw) => certificationResponseSchema.parse(raw)));
  }
}
