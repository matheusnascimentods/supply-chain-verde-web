import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CurrentUserService } from '../../../core/auth/session/current-user/index.service';
import { DashboardRepository } from '../infrastructure/index.repository';
import { DashboardFacade } from './index.facade';

describe('DashboardFacade', () => {
  const recent = { batchId: 1, productName: 'Café', supplierName: 'Fazenda', quantity: 500, unit: 'KG' as const, status: 'TRANSPORT' as const };
  const summary = { activeBatches: 12, expiringCertifications: 3, suppliers: 8, monthlyEmissionKgCo2e: 42.5, recentBatches: [recent] };
  let repository: { loadSummary: ReturnType<typeof vi.fn> };
  let currentUser: { load: ReturnType<typeof vi.fn> };

  function createFacade(): DashboardFacade {
    TestBed.configureTestingModule({
      providers: [DashboardFacade, { provide: DashboardRepository, useValue: repository }, { provide: CurrentUserService, useValue: currentUser }],
    });
    return TestBed.inject(DashboardFacade);
  }

  beforeEach(() => {
    repository = { loadSummary: vi.fn().mockReturnValue(of(summary)) };
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
    facade.load();
    expect(facade.error()).toBe('');
    expect(facade.summary()).toEqual(summary);
  });
});
