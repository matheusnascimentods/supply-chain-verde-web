import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Batch } from '../../../domain/index.model';
import { BatchesRepository } from '../../../infrastructure/index.repository';

/** O mercado cancela um lote pendente. Sem motivo: a API só aceita a transição de PENDING. */
@Injectable({ providedIn: 'root' })
export class CancelBatchUseCase {
  private readonly repository = inject(BatchesRepository);

  execute(batchId: number): Observable<Batch> {
    return this.repository.cancel(batchId);
  }
}
