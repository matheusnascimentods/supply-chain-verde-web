import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { CurrentUserService } from '../../../../core/auth/session/current-user/index.service';
import { ProfileRepository } from '../../../profile';
import { StagesRepository } from '../../infrastructure/stage/index.repository';
import { AdvanceStageError, AdvanceStageUseCase } from '../use-cases/advance-stage/index.use-case';
import { AddStageFacade } from './index.facade';

describe('AddStageFacade', () => {
  const farm = { street: 'Estrada do Café', number: '100', neighborhood: 'Rural', complement: null, zipCode: '13900000', city: 'Amparo', state: 'SP' };
  const submission = {
    batchId: 7,
    stage: { stageType: 'TRANSPORT' as const, destination: null },
    transport: { transportMode: 'ROAD' as const, distance: 10, fuelType: 'DIESEL' as const, capacity: 100 },
    emission: { calculationMethod: 'GHG_PROTOCOL' as const, cargoWeightKg: null },
  };
  const factor = { calculationMethod: 'GHG_PROTOCOL', transportMode: 'ROAD', fuelType: 'DIESEL', energySource: null, value: 0.10356, unit: 'kg CO₂e/t·km', source: 'GHG Protocol', referenceYear: 2024 };
  let profile: { getMyCompany: ReturnType<typeof vi.fn> };
  let currentUser: { load: ReturnType<typeof vi.fn> };
  let advanceStage: { execute: ReturnType<typeof vi.fn> };
  let stages: { listEmissionFactors: ReturnType<typeof vi.fn> };

  function createFacade(): AddStageFacade {
    TestBed.configureTestingModule({
      providers: [
        AddStageFacade,
        { provide: StagesRepository, useValue: stages },
        { provide: CurrentUserService, useValue: currentUser },
        { provide: ProfileRepository, useValue: profile },
        { provide: AdvanceStageUseCase, useValue: advanceStage },
      ],
    });
    return TestBed.inject(AddStageFacade);
  }

  beforeEach(() => {
    profile = { getMyCompany: vi.fn().mockReturnValue(of({ companyId: 9, name: 'Fazenda', address: farm })) };
    currentUser = { load: vi.fn().mockReturnValue(of({ userId: 4, supplierId: 9 })) };
    stages = { listEmissionFactors: vi.fn().mockReturnValue(of([factor])) };
    advanceStage = { execute: vi.fn().mockReturnValue(of({ step: 'stage', chainId: 50 }, { step: 'transport' })) };
  });

  it('loads the address of the own company and the emission factors', () => {
    const facade = createFacade();
    expect(facade.ownAddress()).toEqual(farm);
    expect(facade.factors()).toEqual([factor]);
    expect(facade.loadingChoices()).toBe(false);
  });

  it('starts a pending emission from the saved stage', () => {
    const facade = createFacade();
    facade.startPending({ chainId: 50, transport: { transportId: 1 } } as never);
    facade.submit(submission)!.subscribe();
    expect(advanceStage.execute).toHaveBeenCalledWith(expect.anything(), { chainId: 50, transportSaved: true, emissionSaved: false });
  });

  it('shows the API message when the API refuses the emission', () => {
    const message = 'A emissão desta etapa já foi calculada';
    const cause = new HttpErrorResponse({ status: 409, error: { message } });
    advanceStage.execute.mockReturnValue(throwError(() => new AdvanceStageError('emission', { cause })));
    const facade = createFacade();
    facade.submit(submission)!.subscribe({ error: () => undefined });
    expect(facade.error()).toBe(message);
  });

  it('submits with the responsible user and resumes without repeating saved steps', () => {
    advanceStage.execute.mockReturnValueOnce(
      new Observable((subscriber) => {
        subscriber.next({ step: 'stage', chainId: 50 });
        subscriber.error(new AdvanceStageError('transport'));
      }),
    );
    const facade = createFacade();

    facade.submit(submission)!.subscribe({ error: () => undefined });
    expect(advanceStage.execute).toHaveBeenCalledWith({ ...submission, responsibleUserId: 4 }, { chainId: null, transportSaved: false, emissionSaved: false });
    expect(facade.stageSaved()).toBe(true);
    expect(facade.error()).toBe('A etapa foi registrada, mas não foi possível salvar os dados do transporte. Você pode tentar novamente.');

    advanceStage.execute.mockReturnValueOnce(of({ step: 'transport' }));
    facade.submit(submission)!.subscribe();
    expect(advanceStage.execute).toHaveBeenLastCalledWith(expect.anything(), { chainId: 50, transportSaved: false, emissionSaved: false });
    expect(facade.saving()).toBe(false);
  });

  it('shows the API message when the API refuses the stage', () => {
    const message = 'Transição de etapa inválida: PROCESSING → DISTRIBUTION';
    const cause = new HttpErrorResponse({ status: 400, error: { message } });
    advanceStage.execute.mockReturnValue(throwError(() => new AdvanceStageError('stage', { cause })));
    const facade = createFacade();
    facade.submit(submission)!.subscribe({ error: () => undefined });
    expect(facade.error()).toBe(message);
  });

  it('keeps the generic message when the stage fails for another reason', () => {
    advanceStage.execute.mockReturnValue(throwError(() => new AdvanceStageError('stage', { cause: new HttpErrorResponse({ status: 500 }) })));
    const facade = createFacade();
    facade.submit(submission)!.subscribe({ error: () => undefined });
    expect(facade.error()).toBe('Não foi possível registrar a etapa. Confira os dados e tente novamente.');
  });

  it('cannot submit without identifying the responsible user', () => {
    currentUser.load.mockReturnValue(throwError(() => new Error('401')));
    const facade = createFacade();
    expect(facade.submit(submission)).toBeNull();
    expect(facade.error()).toBe('Não foi possível identificar o usuário responsável pela etapa.');
  });
});
