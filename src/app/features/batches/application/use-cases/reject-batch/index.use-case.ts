import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Batch } from '../../../domain/index.model';
import { BatchesRepository } from '../../../infrastructure/index.repository';

export const MAX_REJECTION_REASON_LENGTH = 500;

/** RF-15: recusa um lote pendente com o motivo, que fica visível para o mercado. */
@Injectable({ providedIn: 'root' })
export class RejectBatchUseCase {
  private readonly repository = inject(BatchesRepository);

  execute(batchId: number, reason: string): Observable<Batch> {
    const trimmed = reason.trim();
    if (!trimmed) return throwError(() => new Error('O motivo da recusa é obrigatório.'));
    return this.repository.reject(batchId, trimmed);
  }
}
