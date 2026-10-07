import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Certification, CertificationStatus, NewCertification } from '../domain/index.model';
import { certificationResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class CertificationsRepository {
  private readonly http = inject(HttpClient);

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
