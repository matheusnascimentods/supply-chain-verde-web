import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STAGE_TYPE_LABELS } from '../../../../batches';
import { CarbonEmission, Stage } from '../../../domain/index.model';

@Component({
  selector: 'app-carbon-chart',
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarbonChartComponent {
  readonly emissions = input<CarbonEmission[]>([]);
  readonly stages = input<Stage[]>([]);

  readonly bars = computed(() => {
    const emissions = this.emissions();
    const stagesById = new Map(this.stages().map((stage) => [stage.chainId, stage]));
    const maxValue = Math.max(...emissions.map((emission) => emission.co2Kg), 0);

    return emissions.map((emission) => {
      const stage = stagesById.get(emission.chainId);
      return {
        ...emission,
        label: stage ? STAGE_TYPE_LABELS[stage.stageType] : `Etapa ${emission.chainId}`,
        width: maxValue > 0 ? Math.max((emission.co2Kg / maxValue) * 100, 2) : 0,
      };
    });
  });
}
