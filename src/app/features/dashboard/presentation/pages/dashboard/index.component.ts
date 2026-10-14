import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { formatNumberBr } from '../../../../../shared/utils/format/index.utils';
import { PRODUCT_UNIT_SYMBOLS, StageBadgeComponent } from '../../../../batches';
import { DashboardFacade } from '../../../application/index.facade';
import { RecentBatch } from '../../../domain/index.model';
import { EmissionLineChartComponent } from '../../components/emission-line-chart/index.component';
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
  imports: [
    RouterLink,
    MetricCardComponent,
    StageBarChartComponent,
    StagePieChartComponent,
    StageBadgeComponent,
    EmissionLineChartComponent,
  ],
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

  // O escopo vem da API: o fornecedor recebe só as próprias emissões.
  readonly emissionsTitle = computed(() => (this.role() === 'supplier' ? 'Suas emissões' : 'Emissões da cadeia'));

  readonly periodTotal = computed(() => `${formatNumberBr(this.facade.periodTotal())} kg CO₂e`);

  // Emissão caindo é bom: queda em verde, alta em vermelho.
  readonly variation = computed(() => {
    const variation = this.facade.variation();
    if (variation === null) return null;
    const arrow = variation < 0 ? '▼' : variation > 0 ? '▲' : '';
    return {
      text: `${arrow} ${formatNumberBr(Math.abs(variation), 1)}%`.trim(),
      tone: variation < 0 ? 'down' : variation > 0 ? 'up' : 'flat',
    };
  });

  protected changeRange(field: 'from' | 'to', event: Event): void {
    this.facade.setRange({ ...this.facade.range(), [field]: (event.target as HTMLInputElement).value });
  }

  protected quantity(batch: RecentBatch): string {
    return `${formatNumberBr(batch.quantity)} ${PRODUCT_UNIT_SYMBOLS[batch.unit]}`;
  }
}
