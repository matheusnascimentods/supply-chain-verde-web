import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { formatKgCo2e, formatNumberBr } from '../../../../../shared/utils/format/index.utils';
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
    FormsModule,
    RouterLink,
    MetricCardComponent,
    StageBarChartComponent,
    StagePieChartComponent,
    StageBadgeComponent,
    EmissionLineChartComponent,
    TextFieldComponent,
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

  // Resumo só quando carregou sem erro; usado nos KPIs e nas análises.
  protected readonly readySummary = computed(() => (this.facade.loading() || this.facade.error() ? null : this.facade.summary()));

  readonly metrics = computed<Metric[]>(() => {
    const summary = this.facade.summary();
    const count = (value: number | undefined) => (value === undefined ? '—' : formatNumberBr(value, 0));
    return [
      { label: 'Lotes Ativos', value: count(summary?.activeBatches), tone: 'batches' },
      { label: 'Certificações Expirando', value: count(summary?.expiringCertifications), tone: 'certifications' },
      { label: 'Fornecedores', value: count(summary?.suppliers), tone: 'suppliers' },
      {
        label: 'Emissão Total (mês)',
        value: summary ? formatKgCo2e(summary.monthlyEmissionKgCo2e) : '—',
        tone: 'emission',
      },
    ];
  });

  // O escopo vem da API: o fornecedor recebe só as próprias emissões.
  readonly emissionsTitle = computed(() => (this.role() === 'supplier' ? 'Suas emissões' : 'Emissões da cadeia'));

  readonly periodTotalLabel = computed(() => formatKgCo2e(this.facade.periodTotal()));

  // Emissão caindo é bom: queda em verde, alta em vermelho.
  readonly variationBadge = computed(() => {
    const variation = this.facade.variation();
    if (variation === null) return null;
    const arrow = variation < 0 ? '▼' : variation > 0 ? '▲' : '';
    return {
      text: `${arrow} ${formatNumberBr(Math.abs(variation), 1)}%`.trim(),
      tone: variation < 0 ? 'down' : variation > 0 ? 'up' : null,
    };
  });

  protected quantity(batch: RecentBatch): string {
    return `${formatNumberBr(batch.quantity)} ${PRODUCT_UNIT_SYMBOLS[batch.unit]}`;
  }
}
