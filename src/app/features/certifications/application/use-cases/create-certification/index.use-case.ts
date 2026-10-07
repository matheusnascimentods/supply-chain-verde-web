import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Certification, NewCertification } from '../../../domain/index.model';
import { CertificationsRepository } from '../../../infrastructure/index.repository';

@Injectable({ providedIn: 'root' })
export class CreateCertificationUseCase {
  private readonly repository = inject(CertificationsRepository);

  execute(supplierId: number, certification: NewCertification): Observable<Certification> {
    return this.repository.create(supplierId, certification);
  }
}
