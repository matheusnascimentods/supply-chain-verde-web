import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../core/session/index.service';
import { UsersService } from '../users/index.service';
import { DashboardStageType, DashboardSummaryResponse, RecentBatchSummary } from './index.api-schema';
import { DASHBOARDS } from './index.constants';
import { DashboardService } from './index.service';

const STAGE_ORDER: DashboardStageType[] = [
  'PRODUCTION',
  'STORAGE',
  'PROCESSING',
  'TRANSPORT',
  'DISTRIBUTION',
  'RETAIL',
];

const STAGE_LABELS: Record<DashboardStageType, string> = {
  PRODUCTION: 'Produção',
  STORAGE: 'Armazenagem',
  PROCESSING: 'Processamento',
  TRANSPORT: 'Transporte',
  DISTRIBUTION: 'Distribuição',
  RETAIL: 'Varejo',
};

const STAGE_COLORS: Record<DashboardStageType, string> = {
  PRODUCTION: '#15803d',
  STORAGE: '#0f766e',
  PROCESSING: '#65a30d',
  TRANSPORT: '#d97706',
  DISTRIBUTION: '#0891b2',
  RETAIL: '#64748b',
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly session = inject(SessionService);
  private readonly dashboardService = inject(DashboardService);
  private readonly usersService = inject(UsersService);

  readonly role = this.session.role;
  readonly summary = signal<DashboardSummaryResponse | null>(null);
  readonly userName = signal('');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly recentBatches = computed(() => this.summary()?.recentBatches ?? []);
  readonly metrics = computed(() => {
    const summary = this.summary();
    return [
      { label: 'Lotes Ativos', value: summary ? this.formatInteger(summary.activeBatches) : '—', accent: 'bg-green-600' },
      { label: 'Certificações Expirando', value: summary ? this.formatInteger(summary.expiringCertifications) : '—', accent: 'bg-amber-500' },
      { label: 'Fornecedores', value: summary ? this.formatInteger(summary.suppliers) : '—', accent: 'bg-teal-600' },
      { label: 'Emissão Total (mês)', value: summary ? `${this.formatNumber(summary.monthlyEmissionKgCo2e)} kg CO₂e` : '—', accent: 'bg-emerald-700' },
    ];
  });
  readonly stageDistribution = computed(() => {
    const batches = this.recentBatches();
    const total = batches.length;
    return STAGE_ORDER.flatMap((stage) => {
      const count = batches.filter((batch) => batch.status === stage).length;
      return count > 0
        ? [{ stage, label: STAGE_LABELS[stage], count, color: STAGE_COLORS[stage], percent: (count / total) * 100 }]
        : [];
    });
  });
  readonly maxStageCount = computed(() => Math.max(1, ...this.stageDistribution().map((item) => item.count)));
  readonly pieSegments = computed(() => {
    let offset = 0;
    return this.stageDistribution().map((item) => {
      const segment = { ...item, offset };
      offset += item.percent;
      return segment;
    });
  });
  readonly greeting = computed(() => {
    const name = this.userName().trim();
    return name ? `Olá, ${name}` : 'Bem-vindo(a)';
  });
  readonly content = computed(() => {
    const role = this.role();
    return role ? DASHBOARDS[role] : null;
  });

  constructor() {
    this.loadSummary();
    this.loadUserName();
  }

  private loadUserName(): void {
    this.usersService.loadCurrentUser().subscribe({
      next: (user) => this.userName.set(user.name),
      error: () => this.userName.set(''),
    });
  }

  loadSummary(): void {
    this.loading.set(true);
    this.error.set('');
    this.dashboardService.loadSummary(10).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar o resumo. Tente novamente.');
        this.loading.set(false);
      },
    });
  }

  formatInteger(value: number): string {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
  }

  formatQuantity(batch: RecentBatchSummary): string {
    const unitLabels: Record<RecentBatchSummary['unit'], string> = {
      KG: 'kg',
      TON: 't',
      LITER: 'L',
      UNIT: 'un',
      M3: 'm³',
    };
    return `${this.formatNumber(batch.quantity)} ${unitLabels[batch.unit]}`;
  }

  barHeight(count: number): number {
    return Math.max((count / this.maxStageCount()) * 100, 8);
  }

  stageLabel(stage: DashboardStageType): string {
    return STAGE_LABELS[stage];
  }

  pieDashArray(percent: number): string {
    const length = (percent / 100) * 100;
    return `${length} ${100 - length}`;
  }

  pieAriaLabel(): string {
    return this.stageDistribution()
      .map((item) => `${item.label}: ${item.count}`)
      .join(', ');
  }
}
