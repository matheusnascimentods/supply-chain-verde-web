import { Injectable, computed, inject, signal } from '@angular/core';
import { CurrentUserService } from '../../../core/auth/session/current-user/index.service';
import { DashboardSummary, MonthRange, MonthlyEmission } from '../domain/index.model';
import { defaultRange, greetingFor, periodVariation, stageDistribution, validateRange } from '../domain/index.rules';
import { DashboardRepository } from '../infrastructure/index.repository';

export const RECENT_BATCHES_LIMIT = 10;

@Injectable()
export class DashboardFacade {
  private readonly repository = inject(DashboardRepository);
  private readonly currentUser = inject(CurrentUserService);
  private readonly userName = signal('');

  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly recentBatches = computed(() => this.summary()?.recentBatches ?? []);
  readonly distribution = computed(() => stageDistribution(this.recentBatches()));
  readonly greeting = computed(() => greetingFor(this.userName()));

  readonly range = signal<MonthRange>(defaultRange(new Date()));
  readonly rangeError = computed(() => validateRange(this.range()));
  readonly emissions = signal<MonthlyEmission[]>([]);
  readonly emissionsLoading = signal(false);
  readonly emissionsError = signal('');
  readonly hasEmissions = computed(() => this.emissions().some((item) => item.co2Kg > 0));
  readonly variation = computed(() => periodVariation(this.emissions()));
  private emissionsSequence = 0;

  constructor() {
    this.load();
    this.loadEmissions();
    this.currentUser.load().subscribe({
      next: (user) => this.userName.set(user.name),
      error: () => this.userName.set(''),
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.repository.loadSummary(RECENT_BATCHES_LIMIT).subscribe({
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

  setRange(range: MonthRange): void {
    this.range.set(range);
    this.loadEmissions();
  }

  /** Intervalo inválido fica só no front, com a mensagem de `rangeError`. */
  loadEmissions(): void {
    const sequence = ++this.emissionsSequence;
    this.emissionsError.set('');
    if (this.rangeError()) {
      this.emissions.set([]);
      this.emissionsLoading.set(false);
      return;
    }
    this.emissionsLoading.set(true);
    this.repository.loadEmissions(this.range()).subscribe({
      next: (series) => {
        if (sequence !== this.emissionsSequence) return;
        this.emissions.set(series);
        this.emissionsLoading.set(false);
      },
      error: () => {
        if (sequence !== this.emissionsSequence) return;
        this.emissionsError.set('Não foi possível carregar as emissões. Tente novamente.');
        this.emissionsLoading.set(false);
      },
    });
  }
}
