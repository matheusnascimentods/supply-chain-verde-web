import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { formatNumberBr } from '../../../../../shared/utils/format/index.utils';
import { PRODUCT_UNIT_SYMBOLS, StageBadgeComponent } from '../../../../batches';
import { DashboardFacade } from '../../../application/index.facade';
import { RecentBatch } from '../../../domain/index.model';
import { MetricCardComponent, MetricTone } from '../../components/metric-card/index.component';
import { StageBarChartComponent } from '../../components/stage-bar-chart/index.component';
import { StagePieChartComponent } from '../../components/stage-pie-chart/index.component';
import { DASHBOARDS } from '../../index.constants';

interface Metric {
  label: string;
  value: string;
  tone: MetricTone;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MetricCardComponent, StageBarChartComponent, StagePieChartComponent, StageBadgeComponent],
  providers: [DashboardFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly role = inject(SessionService).role;
  protected readonly facade = inject(DashboardFacade);

  readonly content = computed(() => {
    const role = this.role();
    return role ? DASHBOARDS[role] : null;
  });

  readonly metrics = computed<Metric[]>(() => {
    const summary = this.facade.summary();
    const count = (value: number | undefined) => (value === undefined ? '—' : formatNumberBr(value, 0));
    return [
      { label: 'Lotes Ativos', value: count(summary?.activeBatches), tone: 'batches' },
      { label: 'Certificações Expirando', value: count(summary?.expiringCertifications), tone: 'certifications' },
      { label: 'Fornecedores', value: count(summary?.suppliers), tone: 'suppliers' },
      {
        label: 'Emissão Total (mês)',
        value: summary ? `${formatNumberBr(summary.monthlyEmissionKgCo2e)} kg CO₂e` : '—',
        tone: 'emission',
      },
    ];
  });

  protected quantity(batch: RecentBatch): string {
    return `${formatNumberBr(batch.quantity)} ${PRODUCT_UNIT_SYMBOLS[batch.unit]}`;
  }
}
