import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SpinnerComponent } from '../../../../../shared/ui/spinner/index.component';
import { Plan } from '../../../domain/index.model';
import { SignupRepository } from '../../../infrastructure/index.repository';
import { PublicHeaderComponent } from '../../components/public-header/index.component';

@Component({
  selector: 'app-plans',
  imports: [RouterLink, SpinnerComponent, PublicHeaderComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent {
  // ponytail: destaque fixo no PRO; vira campo da API quando o catálogo tiver um plano recomendado.
  protected readonly highlightedPlan = 'PRO';
  // Recursos que todos os planos têm; o plano só muda o limite de contas.
  protected readonly features = ['Rastreio de lotes da origem ao varejo', 'Pegada de carbono por etapa', 'Histórico de auditoria'];
  protected readonly plans = signal<Plan[] | null>(null);
  protected readonly failed = signal(false);

  constructor() {
    inject(SignupRepository).listPlans().subscribe({
      next: (plans) => this.plans.set(plans),
      error: () => this.failed.set(true),
    });
  }
}
