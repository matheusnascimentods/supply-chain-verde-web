import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../core/auth/session/index.service';
import { CurrentUserService } from '../../core/auth/session/current-user/index.service';
import { DashboardStageType, DashboardSummaryResponse, RecentBatchSummary } from './index.schema';
import { DASHBOARDS } from './index.constants';
import { formatNumberBr } from '../../shared/utils/format/index.utils';
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

const STAGE_BADGE_CLASSES: Record<DashboardStageType, string> = {
  PRODUCTION: 'bg-green-100 text-green-800',
  STORAGE: 'bg-teal-100 text-teal-800',
  PROCESSING: 'bg-lime-100 text-lime-800',
  TRANSPORT: 'bg-amber-100 text-amber-900',
  DISTRIBUTION: 'bg-sky-100 text-sky-800',
  RETAIL: 'bg-violet-100 text-violet-800',
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly session = inject(SessionService);
  private readonly dashboardService = inject(DashboardService);
  private readonly currentUserService = inject(CurrentUserService);

  readonly role = this.session.role;
  readonly summary = signal<DashboardSummaryResponse | null>(null);
  readonly userName = signal('');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly recentBatches = computed(() => this.summary()?.recentBatches ?? []);
  readonly metrics = computed(() => {
    const summary = this.summary();
    return [
      { label: 'Lotes Ativos', value: summary ? formatNumberBr(summary.activeBatches, 0) : '—', accent: 'bg-green-600' },
      { label: 'Certificações Expirando', value: summary ? formatNumberBr(summary.expiringCertifications, 0) : '—', accent: 'bg-amber-500' },
      { label: 'Fornecedores', value: summary ? formatNumberBr(summary.suppliers, 0) : '—', accent: 'bg-teal-600' },
      { label: 'Emissão Total (mês)', value: summary ? `${formatNumberBr(summary.monthlyEmissionKgCo2e)} kg CO₂e` : '—', accent: 'bg-emerald-700' },
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
    this.currentUserService.load().subscribe({
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

  formatQuantity(batch: RecentBatchSummary): string {
    const unitLabels: Record<RecentBatchSummary['unit'], string> = {
      KG: 'kg',
      TON: 't',
      LITER: 'L',
      UNIT: 'un',
      M3: 'm³',
    };
    return `${formatNumberBr(batch.quantity)} ${unitLabels[batch.unit]}`;
  }

  barHeight(count: number): number {
    return Math.max((count / this.maxStageCount()) * 100, 8);
  }

  stageLabel(stage: DashboardStageType): string {
    return STAGE_LABELS[stage];
  }

  stageBadgeClass(stage: DashboardStageType): string {
    return `rounded-full px-2.5 py-1 text-xs font-medium ${STAGE_BADGE_CLASSES[stage]}`;
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
