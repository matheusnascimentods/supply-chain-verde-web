import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StagesRepository } from '../../../infrastructure/stage/index.repository';
import { AdvanceStageError, AdvanceStageProgress, AdvanceStageUseCase, StageProgress, StageSubmission } from './index.use-case';

describe('AdvanceStageUseCase', () => {
  const transport = { transportMode: 'ROAD' as const, distance: 120, fuelType: 'DIESEL' as const, capacity: 1000 };
  const submission: StageSubmission = {
    batchId: 7,
    responsibleUserId: 2,
    stage: { stageType: 'TRANSPORT', startedAt: '2026-10-05T08:30', endedAt: null, originAddressId: null, destinationAddressId: null },
    transport,
    emissionMethod: 'GHG_PROTOCOL',
  };
  const fresh: StageProgress = { chainId: null, transportSaved: false, emissionSaved: false };
  let stages: { create: ReturnType<typeof vi.fn>; createTransport: ReturnType<typeof vi.fn>; calculateEmission: ReturnType<typeof vi.fn> };
  let useCase: AdvanceStageUseCase;

  beforeEach(() => {
    stages = {
      create: vi.fn().mockReturnValue(of({ chainId: 50 })),
      createTransport: vi.fn().mockReturnValue(of({})),
      calculateEmission: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({ providers: [{ provide: StagesRepository, useValue: stages }] });
    useCase = TestBed.inject(AdvanceStageUseCase);
  });

  function run(input: StageSubmission, progress: StageProgress): { events: AdvanceStageProgress[]; error?: AdvanceStageError } {
    const result: { events: AdvanceStageProgress[]; error?: AdvanceStageError } = { events: [] };
    useCase.execute(input, progress).subscribe({ next: (event) => result.events.push(event), error: (error) => (result.error = error) });
    return result;
  }

  it('registers stage, transport and emission in order', () => {
    const { events } = run(submission, fresh);
    expect(events).toEqual([{ step: 'stage', chainId: 50 }, { step: 'transport' }, { step: 'emission' }]);
    expect(stages.createTransport).toHaveBeenCalledWith(50, transport);
    expect(stages.calculateEmission).toHaveBeenCalledWith(50, 'GHG_PROTOCOL');
  });

  it('skips the optional steps that were not requested', () => {
    const { events } = run({ ...submission, transport: null, emissionMethod: null }, fresh);
    expect(events).toEqual([{ step: 'stage', chainId: 50 }]);
    expect(stages.createTransport).not.toHaveBeenCalled();
  });

  it('resumes after a failure without repeating what was saved', () => {
    const { events } = run(submission, { chainId: 50, transportSaved: true, emissionSaved: false });
    expect(stages.create).not.toHaveBeenCalled();
    expect(stages.createTransport).not.toHaveBeenCalled();
    expect(events).toEqual([{ step: 'emission' }]);
  });

  it('reports the failing step', () => {
    stages.createTransport.mockReturnValue(throwError(() => new Error('500')));
    const { events, error } = run(submission, fresh);
    expect(events).toEqual([{ step: 'stage', chainId: 50 }]);
    expect(error?.step).toBe('transport');
    expect(stages.calculateEmission).not.toHaveBeenCalled();
  });
});
