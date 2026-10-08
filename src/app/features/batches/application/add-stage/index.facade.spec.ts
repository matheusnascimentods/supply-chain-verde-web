import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { CurrentUserService } from '../../../../core/auth/session/current-user/index.service';
import { SessionService } from '../../../../core/auth/session/index.service';
import { SuppliersRepository } from '../../../suppliers';
import { AdvanceStageError, AdvanceStageUseCase } from '../use-cases/advance-stage/index.use-case';
import { AddStageFacade } from './index.facade';

describe('AddStageFacade', () => {
  const supplier = (supplierId: number, city: string) => ({
    supplierId,
    name: `Fornecedor ${supplierId}`,
    address: { addressId: supplierId * 10, city, state: 'SP' },
  });
  const submission = {
    batchId: 7,
    stage: { stageType: 'TRANSPORT' as const, startedAt: '2026-10-05T08:30', endedAt: null, originAddressId: null, destinationAddressId: null },
    transport: { transportMode: 'ROAD' as const, distance: 10, fuelType: 'DIESEL' as const, capacity: 100 },
    emissionMethod: null,
  };
  let suppliers: { get: ReturnType<typeof vi.fn>; load: ReturnType<typeof vi.fn> };
  let currentUser: { load: ReturnType<typeof vi.fn> };
  let advanceStage: { execute: ReturnType<typeof vi.fn> };

  function createFacade(role: string): AddStageFacade {
    TestBed.configureTestingModule({
      providers: [
        AddStageFacade,
        { provide: SessionService, useValue: { role: () => role } },
        { provide: CurrentUserService, useValue: currentUser },
        { provide: SuppliersRepository, useValue: suppliers },
        { provide: AdvanceStageUseCase, useValue: advanceStage },
      ],
    });
    return TestBed.inject(AddStageFacade);
  }

  beforeEach(() => {
    suppliers = {
      get: vi.fn().mockReturnValue(of(supplier(9, 'Campinas'))),
      load: vi.fn().mockReturnValue(of([supplier(1, 'São Paulo'), { supplierId: 2, name: 'Sem endereço', address: null }])),
    };
    currentUser = { load: vi.fn().mockReturnValue(of({ userId: 9 })) };
    advanceStage = { execute: vi.fn().mockReturnValue(of({ step: 'stage', chainId: 50 }, { step: 'transport' })) };
  });

  it('offers only the own address to suppliers', () => {
    const facade = createFacade('supplier');
    expect(suppliers.get).toHaveBeenCalledWith(9);
    expect(facade.addresses()).toEqual([{ addressId: 90, label: 'Fornecedor 9 — Campinas/SP' }]);
    expect(facade.canCalculateEmission).toBe(false);
  });

  it('offers the addresses of every supplier to other profiles', () => {
    const facade = createFacade('manager');
    expect(facade.addresses()).toEqual([{ addressId: 10, label: 'Fornecedor 1 — São Paulo/SP' }]);
    expect(facade.canCalculateEmission).toBe(true);
    expect(facade.loadingChoices()).toBe(false);
  });

  it('submits with the responsible user and resumes without repeating saved steps', () => {
    advanceStage.execute.mockReturnValueOnce(
      new Observable((subscriber) => {
        subscriber.next({ step: 'stage', chainId: 50 });
        subscriber.error(new AdvanceStageError('transport'));
      }),
    );
    const facade = createFacade('manager');

    facade.submit(submission)!.subscribe({ error: () => undefined });
    expect(advanceStage.execute).toHaveBeenCalledWith({ ...submission, responsibleUserId: 9 }, { chainId: null, transportSaved: false, emissionSaved: false });
    expect(facade.stageSaved()).toBe(true);
    expect(facade.error()).toBe('A etapa foi registrada, mas não foi possível salvar os dados do transporte. Você pode tentar novamente.');

    advanceStage.execute.mockReturnValueOnce(of({ step: 'transport' }));
    facade.submit(submission)!.subscribe();
    expect(advanceStage.execute).toHaveBeenLastCalledWith(expect.anything(), { chainId: 50, transportSaved: false, emissionSaved: false });
    expect(facade.saving()).toBe(false);
  });

  it('cannot submit without identifying the responsible user', () => {
    currentUser.load.mockReturnValue(throwError(() => new Error('401')));
    const facade = createFacade('manager');
    expect(facade.submit(submission)).toBeNull();
    expect(facade.error()).toBe('Não foi possível identificar o usuário responsável pela etapa.');
  });
});
