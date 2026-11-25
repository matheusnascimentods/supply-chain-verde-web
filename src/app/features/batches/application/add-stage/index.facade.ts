import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, tap } from 'rxjs';
import { CurrentUserService } from '../../../../core/auth/session/current-user/index.service';
import { SessionService } from '../../../../core/auth/session/index.service';
import { OwnCompany, ProfileRepository } from '../../../profile';
import { apiErrorMessage } from '../../../../shared/utils/http/index.utils';
import { canCalculateEmission } from '../../domain/index.rules';
import {
  AdvanceStageError,
  AdvanceStageProgress,
  AdvanceStageStep,
  AdvanceStageUseCase,
  StageProgress,
  StageSubmission,
} from '../use-cases/advance-stage/index.use-case';

const FAILURE_MESSAGES: Record<AdvanceStageStep, string> = {
  stage: 'Não foi possível registrar a etapa. Confira os dados e tente novamente.',
  transport: 'A etapa foi registrada, mas não foi possível salvar os dados do transporte. Você pode tentar novamente.',
  emission: 'A etapa foi registrada, mas não foi possível calcular a emissão. Você pode tentar novamente.',
};

@Injectable()
export class AddStageFacade {
  private readonly currentUser = inject(CurrentUserService);
  private readonly profile = inject(ProfileRepository);
  private readonly advanceStage = inject(AdvanceStageUseCase);
  private readonly session = inject(SessionService);
  private readonly role = this.session.role();
  private responsibleUserId: number | null = null;
  private progress: StageProgress = { chainId: null, transportSaved: false, emissionSaved: false };

  readonly canCalculateEmission = canCalculateEmission(this.role);
  readonly loadingChoices = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly ownAddress = signal<OwnCompany['address']>(null);
  readonly stageSaved = signal(false);

  constructor() {
    this.loadChoices();
  }

  submit(submission: Omit<StageSubmission, 'responsibleUserId'>): Observable<AdvanceStageProgress> | null {
    if (!this.responsibleUserId) {
      this.error.set('Não foi possível identificar o usuário responsável pela etapa.');
      return null;
    }
    this.saving.set(true);
    this.error.set('');
    return this.advanceStage.execute({ ...submission, responsibleUserId: this.responsibleUserId }, { ...this.progress }).pipe(
      tap({
        next: (event) => {
          if (event.step === 'stage') {
            this.progress.chainId = event.chainId;
            this.stageSaved.set(true);
          } else if (event.step === 'transport') {
            this.progress.transportSaved = true;
          } else {
            this.progress.emissionSaved = true;
          }
        },
        complete: () => this.saving.set(false),
        error: (error: unknown) => {
          this.saving.set(false);
          const step = error instanceof AdvanceStageError ? error.step : 'stage';
          const cause = error instanceof AdvanceStageError ? error.cause : error;
          // Só a recusa da etapa traz regra da API (ex.: transição fora de ordem); os outros passos dizem que a etapa já foi salva.
          this.error.set(step === 'stage' ? apiErrorMessage(cause, FAILURE_MESSAGES.stage) : FAILURE_MESSAGES[step]);
        },
      }),
    );
  }

  // A companhia de quem registra dá a origem da Produção (fornecedor) e o destino do Varejo (mercado): RN-03/RN-04 da API.
  private loadChoices(): void {
    forkJoin({ user: this.currentUser.load(), company: this.profile.getMyCompany() }).subscribe({
      next: ({ user, company }) => {
        this.responsibleUserId = user.userId;
        this.ownAddress.set(company.address);
        this.loadingChoices.set(false);
      },
      error: () => {
        this.loadingChoices.set(false);
        this.error.set('Não foi possível identificar o usuário responsável pela etapa.');
      },
    });
  }
}
