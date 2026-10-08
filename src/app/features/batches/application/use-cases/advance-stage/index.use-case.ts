import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, catchError, concat, defer, map, tap, throwError } from 'rxjs';
import { CalculationMethod, NewStage, NewTransport } from '../../../domain/stage/index.model';
import { StagesRepository } from '../../../infrastructure/stage/index.repository';

export interface StageSubmission {
  batchId: number;
  responsibleUserId: number;
  stage: NewStage;
  transport: NewTransport | null;
  emissionMethod: CalculationMethod | null;
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
  constructor(readonly step: AdvanceStageStep) {
    super(`Falha ao salvar ${step}`);
  }
}

const failAt = <T>(step: AdvanceStageStep) =>
  catchError<T, Observable<never>>(() => throwError(() => new AdvanceStageError(step)));

/** Registra a etapa e, quando pedidos, o transporte e o cálculo de emissão dela. */
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
      !submission.emissionMethod || progress.emissionSaved
        ? EMPTY
        : this.stages.calculateEmission(chainId!, submission.emissionMethod).pipe(
            map((): AdvanceStageProgress => ({ step: 'emission' })),
            failAt('emission'),
          ),
    );
    return concat(stage$, transport$, emission$);
  }
}
