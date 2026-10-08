import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SpinnerComponent } from '../../../../../shared/ui/spinner/index.component';
import { STAGE_TYPE_LABELS, TRANSPORT_MODE_LABELS } from '../../../../batches';
import { TraceabilityFacade } from '../../../application/index.facade';
import { placeOf } from '../../../domain/index.rules';
import { CarbonChartComponent } from '../../components/carbon-chart/index.component';

@Component({
  selector: 'app-traceability',
  imports: [DatePipe, SpinnerComponent, CarbonChartComponent],
  providers: [TraceabilityFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceabilityComponent {
  protected readonly facade = inject(TraceabilityFacade);
  protected readonly stageLabels = STAGE_TYPE_LABELS;
  protected readonly transportLabels = TRANSPORT_MODE_LABELS;
  protected readonly placeOf = placeOf;

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => this.facade.load(params.get('batchId')));
  }
}
