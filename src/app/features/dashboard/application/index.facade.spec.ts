import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { CurrentUserService } from '../../../core/auth/session/current-user/index.service';
import { DashboardRepository } from '../infrastructure/index.repository';
import { DashboardFacade } from './index.facade';

describe('DashboardFacade', () => {
  const recent = { batchId: 1, productName: 'Café', supplierName: 'Fazenda', quantity: 500, unit: 'KG' as const, status: 'TRANSPORT' as const };
  const summary = { activeBatches: 12, expiringCertifications: 3, suppliers: 8, monthlyEmissionKgCo2e: 42.5, recentBatches: [recent] };
  let repository: { loadSummary: ReturnType<typeof vi.fn>; loadEmissions: ReturnType<typeof vi.fn> };
  const series = [{ month: '2026-01', co2Kg: 100 }, { month: '2026-02', co2Kg: 80 }];
  let currentUser: { load: ReturnType<typeof vi.fn> };

  function createFacade(): DashboardFacade {
    TestBed.configureTestingModule({
      providers: [DashboardFacade, { provide: DashboardRepository, useValue: repository }, { provide: CurrentUserService, useValue: currentUser }],
    });
    return TestBed.inject(DashboardFacade);
  }

  beforeEach(() => {
    repository = { loadSummary: vi.fn().mockReturnValue(of(summary)), loadEmissions: vi.fn().mockReturnValue(of(series)) };
    currentUser = { load: vi.fn().mockReturnValue(of({ name: 'Maria Gabriela Brito' })) };
  });

  it('loads the summary with the 10 most recent batches and greets the user', () => {
    const facade = createFacade();
    expect(repository.loadSummary).toHaveBeenCalledWith(10);
    expect(facade.summary()).toEqual(summary);
    expect(facade.distribution()).toEqual([{ stage: 'TRANSPORT', count: 1, percent: 100 }]);
    expect(facade.greeting()).toBe('Olá, Maria Gabriela Brito');
  });

  it('uses a neutral greeting when the user cannot be loaded', () => {
    currentUser.load.mockReturnValue(throwError(() => new Error('401')));
    expect(createFacade().greeting()).toBe('Bem-vindo(a)');
  });

  it('shows a recoverable error when the summary fails', () => {
    repository.loadSummary.mockReturnValueOnce(throwError(() => new Error('500')));
    const facade = createFacade();
    expect(facade.error()).toBe('Não foi possível carregar o resumo. Tente novamente.');
    expect(facade.readySummary()).toBeNull();
    facade.load();
    expect(facade.error()).toBe('');
    expect(facade.readySummary()).toEqual(summary);
  });

  it('loads the emissions of the last 12 months on creation', () => {
    const facade = createFacade();
    expect(repository.loadEmissions).toHaveBeenCalledWith(facade.range());
    expect(facade.emissions()).toEqual(series);
    expect(facade.variation()).toBeCloseTo(-20);
  });

  it('reloads with a valid range and blocks an invalid one without calling the API', () => {
    const facade = createFacade();
    facade.setRange({ from: '2026-01', to: '2026-06' });
    expect(repository.loadEmissions).toHaveBeenLastCalledWith({ from: '2026-01', to: '2026-06' });

    facade.setRange({ from: '2026-07', to: '2026-06' });
    expect(repository.loadEmissions).toHaveBeenCalledTimes(2);
    expect(facade.rangeError()).toBe('O mês inicial deve ser anterior ou igual ao final.');
    expect(facade.emissions()).toEqual([]);

    facade.setRange({ from: 'jan 2026', to: '2026-06' });
    expect(repository.loadEmissions).toHaveBeenCalledTimes(2);
    expect(facade.rangeError()).toBe('Informe o mês inicial e o final.');
  });

  it('ignores the response of a range that was already replaced', () => {
    const pending = new Subject<typeof series>();
    repository.loadEmissions.mockReturnValueOnce(pending);
    const facade = createFacade();
    facade.setRange({ from: '2026-01', to: '2026-06' });
    pending.next([{ month: '2025-01', co2Kg: 1 }]);
    expect(facade.emissions()).toEqual(series);
  });

  it('shows an error when the emissions fail', () => {
    repository.loadEmissions.mockReturnValueOnce(throwError(() => new Error('500')));
    const facade = createFacade();
    expect(facade.emissionsError()).toBe('Não foi possível carregar as emissões. Tente novamente.');
    expect(facade.emissionsLoading()).toBe(false);
  });
});
