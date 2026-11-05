import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CompanyType, UserRole } from '../../../core/auth/session/index.model';
import { SessionService } from '../../../core/auth/session/index.service';
import { Batch } from '../domain/index.model';
import { BatchesRepository } from '../infrastructure/index.repository';
import { ProductsRepository } from '../infrastructure/product/index.repository';
import { BatchesListFacade } from './index.facade';

describe('BatchesListFacade', () => {
  const batch = { batchId: 7, productId: 3, status: 'ACTIVE', currentStage: null, stages: [] } as unknown as Batch;
  const role = signal<UserRole | null>('manager');
  const companyType = signal<CompanyType | null>('market');
  let repository: { load: ReturnType<typeof vi.fn> };
  let products: { loadAll: ReturnType<typeof vi.fn> };

  function createFacade(query: Record<string, string> = {}): BatchesListFacade {
    TestBed.configureTestingModule({
      providers: [
        BatchesListFacade,
        { provide: BatchesRepository, useValue: repository },
        { provide: ProductsRepository, useValue: products },
        { provide: SessionService, useValue: { role, companyType } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    });
    return TestBed.inject(BatchesListFacade);
  }

  beforeEach(() => {
    role.set('manager');
    companyType.set('market');
    repository = { load: vi.fn().mockReturnValue(of({ items: [batch], page: 0, totalPages: 2, totalElements: 21 })) };
    products = { loadAll: vi.fn().mockReturnValue(of([{ productId: 3, unit: 'TON' }])) };
  });

  it('loads the first page and the product units', () => {
    const facade = createFacade();
    expect(repository.load).toHaveBeenCalledWith({ page: 0, size: 20, status: null });
    expect(facade.items()).toEqual([batch]);
    expect(facade.totalElements()).toBe(21);
    expect(facade.unitOf(batch)).toBe('TON');
    expect(facade.unitOf({ ...batch, productId: null })).toBeUndefined();
  });

  it('pages within the bounds and restarts from the first page', () => {
    const facade = createFacade();
    facade.previousPage();
    expect(repository.load).toHaveBeenCalledTimes(1);
    facade.nextPage();
    expect(repository.load).toHaveBeenLastCalledWith({ page: 1, size: 20, status: null });
    facade.reloadFromFirstPage();
    expect(repository.load).toHaveBeenLastCalledWith({ page: 0, size: 20, status: null });
  });

  it('shows an error when the batches cannot be loaded', () => {
    repository.load.mockReturnValue(throwError(() => new Error('500')));
    const facade = createFacade();
    expect(facade.error()).toBe('Não foi possível carregar os lotes. Tente novamente.');
  });

  it('applies the permission rules of the session and company', () => {
    const facade = createFacade();
    expect(facade.canCreate()).toBe(true);
    expect(facade.canAddStageTo(batch)).toBe(true);
    role.set('auditor');
    expect(facade.canCreate()).toBe(false);
    expect(facade.canAddStageTo(batch)).toBe(false);
  });

  it('starts with the status of the URL, as the dashboard pending link sends', () => {
    const facade = createFacade({ status: 'PENDING' });
    expect(facade.status()).toBe('PENDING');
    expect(repository.load).toHaveBeenCalledWith({ page: 0, size: 20, status: 'PENDING' });
  });

  it('ignores an unknown status in the URL', () => {
    expect(createFacade({ status: 'LOST' }).status()).toBeNull();
  });

  it('filters by status from the first page, and clears with an empty value', () => {
    const facade = createFacade();
    facade.nextPage();
    facade.setStatus('REJECTED');
    expect(repository.load).toHaveBeenLastCalledWith({ page: 0, size: 20, status: 'REJECTED' });
    facade.setStatus('');
    expect(repository.load).toHaveBeenLastCalledWith({ page: 0, size: 20, status: null });
  });
});
