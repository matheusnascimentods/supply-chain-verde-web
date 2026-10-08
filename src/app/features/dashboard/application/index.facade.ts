import { Injectable, computed, inject, signal } from '@angular/core';
import { CurrentUserService } from '../../../core/auth/session/current-user/index.service';
import { DashboardSummary } from '../domain/index.model';
import { greetingFor, stageDistribution } from '../domain/index.rules';
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

  constructor() {
    this.load();
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
}
