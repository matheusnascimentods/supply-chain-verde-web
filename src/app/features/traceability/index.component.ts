import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SpinnerComponent } from '../../shared/components/spinner/index.component';
import { CarbonChartComponent } from './carbon-chart/index.component';
import { TraceabilityService } from './index.service';
import { BatchTraceabilityResponseDTO, CarbonFootprintResponseDTO } from './index.schema';

@Component({
  selector: 'app-traceability',
  imports: [DatePipe, SpinnerComponent, CarbonChartComponent],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceabilityComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly traceabilityService = inject(TraceabilityService);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly traceability = signal<BatchTraceabilityResponseDTO | null>(null);
  readonly footprint = signal<CarbonFootprintResponseDTO | null>(null);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const batchId = params.get('batchId');
      if (!batchId || !/^\d+$/.test(batchId)) {
        this.showError();
        return;
      }
      this.loadBatch(batchId);
    });
  }

  private loadBatch(batchId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.traceability.set(null);
    this.footprint.set(null);

    forkJoin({
      traceability: this.traceabilityService.getTraceability(batchId),
      footprint: this.traceabilityService.getCarbonFootprint(batchId),
    }).subscribe({
      next: ({ traceability, footprint }) => {
        this.traceability.set(traceability);
        this.footprint.set(footprint);
        this.isLoading.set(false);
      },
      error: () => this.showError(),
    });
  }

  private showError(): void {
    this.traceability.set(null);
    this.footprint.set(null);
    this.errorMessage.set('Não foi possível localizar as informações deste lote. Confira o código e tente novamente.');
    this.isLoading.set(false);
  }

  stageLabel(stageType: string): string {
    const labels: Record<string, string> = {
      PRODUCTION: 'Produção', STORAGE: 'Armazenagem', PROCESSING: 'Processamento',
      TRANSPORT: 'Transporte', DISTRIBUTION: 'Distribuição', RETAIL: 'Varejo',
    };
    return labels[stageType] ?? stageType;
  }

  addressLabel(address: { street: string; number: string; city: string; state: string } | null): string {
    if (!address) return 'Não informado';
    return `${address.street}, ${address.number} — ${address.city}, ${address.state}`;
  }

  transportLabel(mode: string): string {
    const labels: Record<string, string> = { ROAD: 'Rodoviário', RAIL: 'Ferroviário', MARITIME: 'Marítimo', AIR: 'Aéreo' };
    return labels[mode] ?? mode;
  }
}
