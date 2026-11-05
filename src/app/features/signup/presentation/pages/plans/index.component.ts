import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';
import { SpinnerComponent } from '../../../../../shared/ui/spinner/index.component';
import { Plan } from '../../../domain/index.model';
import { SignupRepository } from '../../../infrastructure/index.repository';
import { PublicHeaderComponent } from '../../components/public-header/index.component';

@Component({
  selector: 'app-plans',
  imports: [RouterLink, ButtonComponent, SpinnerComponent, PublicHeaderComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent {
  protected readonly plans = signal<Plan[] | null>(null);
  protected readonly failed = signal(false);

  constructor() {
    inject(SignupRepository).listPlans().subscribe({
      next: (plans) => this.plans.set(plans),
      error: () => this.failed.set(true),
    });
  }
}
