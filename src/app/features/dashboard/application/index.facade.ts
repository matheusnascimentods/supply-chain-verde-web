import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap, tap } from 'rxjs';
import { CurrentUserService } from '../../../core/auth/session/current-user/index.service';
import { DashboardSummary, MAX_RANGE_MONTHS, MonthRange, MonthlyEmission, RangeProblem } from '../domain/index.model';
import { defaultRange, greetingFor, periodTotal, periodVariation, rangeProblem, stageDistribution } from '../domain/index.rules';
import { DashboardRepository } from '../infrastructure/index.repository';

export const RECENT_BATCHES_LIMIT = 10;

const RANGE_MESSAGES: Record<RangeProblem, string> = {
  invalid: 'Informe o mês inicial e o final no formato AAAA-MM.',
  order: 'O mês inicial deve ser anterior ou igual ao final.',
  tooLong: `Escolha um intervalo de até ${MAX_RANGE_MONTHS} meses.`,
};

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
  readonly rangeError = computed(() => {
    const problem = rangeProblem(this.range());
    return problem ? RANGE_MESSAGES[problem] : '';
  });
  readonly emissions = signal<MonthlyEmission[]>([]);
  readonly emissionsLoading = signal(false);
  readonly emissionsError = signal('');
  readonly hasEmissions = computed(() => this.emissions().some((item) => item.co2Kg > 0));
  readonly variation = computed(() => periodVariation(this.emissions()));
  readonly periodTotal = computed(() => periodTotal(this.emissions()));
  private readonly emissionsRequests = new Subject<MonthRange>();

  constructor() {
    // switchMap descarta a resposta de um intervalo que já foi trocado.
    this.emissionsRequests.pipe(switchMap((range) => this.fetchEmissions(range)), takeUntilDestroyed()).subscribe();
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
    this.summary.set(null);
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

  setRange(change: Partial<MonthRange>): void {
    this.range.update((range) => ({ ...range, ...change }));
    this.loadEmissions();
  }

  loadEmissions(): void {
    this.emissionsRequests.next(this.range());
  }

  /** Intervalo inválido fica só no front, com a mensagem de `rangeError`. */
  private fetchEmissions(range: MonthRange) {
    this.emissionsError.set('');
    if (rangeProblem(range)) {
      this.emissions.set([]);
      this.emissionsLoading.set(false);
      return EMPTY;
    }
    this.emissionsLoading.set(true);
    return this.repository.loadEmissions(range).pipe(
      tap((series) => {
        this.emissions.set(series);
        this.emissionsLoading.set(false);
      }),
      catchError(() => {
        this.emissionsError.set('Não foi possível carregar as emissões. Tente novamente.');
        this.emissionsLoading.set(false);
        return EMPTY;
      }),
    );
  }
}
