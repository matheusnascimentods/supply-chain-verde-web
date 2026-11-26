import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, tap } from 'rxjs';
import { CurrentUserService } from '../../../../core/auth/session/current-user/index.service';
import { OwnCompany, ProfileRepository } from '../../../profile';
import { apiErrorMessage } from '../../../../shared/utils/http/index.utils';
import { EmissionFactor, Stage } from '../../domain/stage/index.model';
import { StagesRepository } from '../../infrastructure/stage/index.repository';
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
  private readonly stages = inject(StagesRepository);
  private readonly advanceStage = inject(AdvanceStageUseCase);
  private responsibleUserId: number | null = null;
  private progress: StageProgress = { chainId: null, transportSaved: false, emissionSaved: false };

  readonly loadingChoices = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly ownAddress = signal<OwnCompany['address']>(null);
  readonly factors = signal<EmissionFactor[]>([]);
  readonly stageSaved = signal(false);

  constructor() {
    this.loadChoices();
  }

  /** Emissão pendente de uma etapa já salva: falta a emissão e, se a etapa não tiver, o transporte. Chamar uma vez, ao abrir. */
  startPending(stage: Stage): void {
    this.progress = { chainId: stage.chainId, transportSaved: stage.transport !== null, emissionSaved: false };
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
          // A etapa e a emissão trazem regra da API (transição fora de ordem, emissão já calculada): RF-09.
          this.error.set(step === 'transport' ? FAILURE_MESSAGES.transport : apiErrorMessage(cause, FAILURE_MESSAGES[step]));
        },
      }),
    );
  }

  // A companhia de quem registra dá a origem da Produção (fornecedor) e o destino do Varejo (mercado): RN-03/RN-04 da API.
  private loadChoices(): void {
    forkJoin({ user: this.currentUser.load(), company: this.profile.getMyCompany(), factors: this.stages.listEmissionFactors() }).subscribe({
      next: ({ user, company, factors }) => {
        this.responsibleUserId = user.userId;
        this.ownAddress.set(company.address);
        this.factors.set(factors);
        this.loadingChoices.set(false);
      },
      error: () => {
        this.loadingChoices.set(false);
        this.error.set('Não foi possível identificar o usuário responsável pela etapa.');
      },
    });
  }
}
