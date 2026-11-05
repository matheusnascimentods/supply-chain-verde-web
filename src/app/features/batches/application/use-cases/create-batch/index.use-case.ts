import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Batch, NewBatch } from '../../../domain/index.model';
import { BatchesRepository } from '../../../infrastructure/index.repository';

/** RF-13: o mercado pede o lote com um produto do fornecedor escolhido; um único POST, que nasce PENDING. */
@Injectable({ providedIn: 'root' })
export class CreateBatchUseCase {
  private readonly batches = inject(BatchesRepository);

  execute(batch: NewBatch): Observable<Batch> {
    return this.batches.create(batch);
  }
}
