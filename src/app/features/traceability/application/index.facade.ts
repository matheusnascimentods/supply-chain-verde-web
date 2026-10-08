import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { BatchTraceability, CarbonFootprint } from '../domain/index.model';
import { isValidBatchCode } from '../domain/index.rules';
import { TraceabilityRepository } from '../infrastructure/index.repository';

@Injectable()
export class TraceabilityFacade {
  private readonly repository = inject(TraceabilityRepository);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly traceability = signal<BatchTraceability | null>(null);
  readonly footprint = signal<CarbonFootprint | null>(null);

  load(batchId: string | null): void {
    if (!isValidBatchCode(batchId)) {
      this.showError();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.traceability.set(null);
    this.footprint.set(null);
    forkJoin({
      traceability: this.repository.getTraceability(batchId),
      footprint: this.repository.getCarbonFootprint(batchId),
    }).subscribe({
      next: ({ traceability, footprint }) => {
        this.traceability.set(traceability);
        this.footprint.set(footprint);
        this.isLoading.set(false);
      },
      error: () => this.showError(),
    });
  }

  // A página é pública: o detalhe técnico do erro não é exibido.
  private showError(): void {
    this.traceability.set(null);
    this.footprint.set(null);
    this.errorMessage.set('Não foi possível localizar as informações deste lote. Confira o código e tente novamente.');
    this.isLoading.set(false);
  }
}
