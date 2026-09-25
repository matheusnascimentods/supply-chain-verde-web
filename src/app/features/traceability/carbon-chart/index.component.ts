import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CarbonEmissionResponseDTO, ChainResponseDTO } from '../index.schema';

@Component({
  selector: 'app-carbon-chart',
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarbonChartComponent {
  readonly emissions = input<CarbonEmissionResponseDTO[]>([]);
  readonly stages = input<ChainResponseDTO[]>([]);

  readonly bars = computed(() => {
    const emissions = this.emissions();
    const stagesById = new Map(this.stages().map((stage) => [stage.chainId, stage]));
    const maxValue = Math.max(...emissions.map((emission) => emission.co2Kg), 0);

    return emissions.map((emission) => {
      const stage = stagesById.get(emission.chainId);
      return {
        ...emission,
        label: stage ? this.stageLabel(stage.stageType) : `Etapa ${emission.chainId}`,
        width: maxValue > 0 ? Math.max((emission.co2Kg / maxValue) * 100, 2) : 0,
      };
    });
  });

  private stageLabel(stageType: string): string {
    const labels: Record<string, string> = {
      PRODUCTION: 'Produção', STORAGE: 'Armazenagem', PROCESSING: 'Processamento',
      TRANSPORT: 'Transporte', DISTRIBUTION: 'Distribuição', RETAIL: 'Varejo',
    };
    return labels[stageType] ?? stageType;
  }
}
