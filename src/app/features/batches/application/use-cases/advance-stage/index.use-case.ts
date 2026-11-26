import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, catchError, concat, defer, map, tap, throwError } from 'rxjs';
import { NewEmission, NewStage, NewTransport } from '../../../domain/stage/index.model';
import { StagesRepository } from '../../../infrastructure/stage/index.repository';

export interface StageSubmission {
  batchId: number;
  responsibleUserId: number;
  stage: NewStage;
  transport: NewTransport | null;
  emission: NewEmission;
}

/** O que já foi salvo numa tentativa anterior, para não repetir. */
export interface StageProgress {
  chainId: number | null;
  transportSaved: boolean;
  emissionSaved: boolean;
}

export type AdvanceStageProgress = { step: 'stage'; chainId: number } | { step: 'transport' } | { step: 'emission' };

export type AdvanceStageStep = AdvanceStageProgress['step'];

export class AdvanceStageError extends Error {
  constructor(readonly step: AdvanceStageStep, options?: ErrorOptions) {
    super(`Falha ao salvar ${step}`, options);
  }
}

const failAt = <T>(step: AdvanceStageStep) =>
  catchError<T, Observable<never>>((cause) => throwError(() => new AdvanceStageError(step, { cause })));

/** Registra a etapa, o transporte (quando há) e a emissão dela, que é obrigatória (RN-11 da API). */
@Injectable({ providedIn: 'root' })
export class AdvanceStageUseCase {
  private readonly stages = inject(StagesRepository);

  execute(submission: StageSubmission, progress: StageProgress): Observable<AdvanceStageProgress> {
    let chainId = progress.chainId;

    const stage$ = defer(() =>
      chainId !== null
        ? EMPTY
        : this.stages.create(submission.batchId, submission.responsibleUserId, submission.stage).pipe(
            tap((stage) => (chainId = stage.chainId)),
            map((stage): AdvanceStageProgress => ({ step: 'stage', chainId: stage.chainId })),
            failAt('stage'),
          ),
    );
    const transport$ = defer(() =>
      !submission.transport || progress.transportSaved
        ? EMPTY
        : this.stages.createTransport(chainId!, submission.transport).pipe(
            map((): AdvanceStageProgress => ({ step: 'transport' })),
            failAt('transport'),
          ),
    );
    const emission$ = defer(() =>
      progress.emissionSaved
        ? EMPTY
        : this.stages.calculateEmission(chainId!, submission.emission).pipe(
            map((): AdvanceStageProgress => ({ step: 'emission' })),
            failAt('emission'),
          ),
    );
    return concat(stage$, transport$, emission$);
  }
}
