import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Certification, CertificationStatus } from '../../../domain/index.model';
import { CertificationsRepository } from '../../../infrastructure/index.repository';

@Injectable({ providedIn: 'root' })
export class UpdateCertificationStatusUseCase {
  private readonly repository = inject(CertificationsRepository);

  execute(certificationId: number, status: CertificationStatus): Observable<Certification> {
    return this.repository.updateStatus(certificationId, status);
  }
}
