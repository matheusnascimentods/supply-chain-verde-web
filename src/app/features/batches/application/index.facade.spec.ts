import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserRole } from '../../../core/auth/session/index.model';
import { SessionService } from '../../../core/auth/session/index.service';
import { Batch } from '../domain/index.model';
import { BatchesRepository } from '../infrastructure/index.repository';
import { ProductsRepository } from '../infrastructure/product/index.repository';
import { BatchesListFacade } from './index.facade';

describe('BatchesListFacade', () => {
  const batch = { batchId: 7, productId: 3, currentStage: null, stages: [] } as unknown as Batch;
  const role = signal<UserRole | null>('supplier');
  let repository: { load: ReturnType<typeof vi.fn> };
  let products: { loadAll: ReturnType<typeof vi.fn> };

  function createFacade(): BatchesListFacade {
    TestBed.configureTestingModule({
      providers: [
        BatchesListFacade,
        { provide: BatchesRepository, useValue: repository },
        { provide: ProductsRepository, useValue: products },
        { provide: SessionService, useValue: { role } },
      ],
    });
    return TestBed.inject(BatchesListFacade);
  }

  beforeEach(() => {
    role.set('supplier');
    repository = { load: vi.fn().mockReturnValue(of({ items: [batch], page: 0, totalPages: 2, totalElements: 21 })) };
    products = { loadAll: vi.fn().mockReturnValue(of([{ productId: 3, unit: 'TON' }])) };
  });

  it('loads the first page and the product units', () => {
    const facade = createFacade();
    expect(repository.load).toHaveBeenCalledWith({ page: 0, size: 20 });
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
    expect(repository.load).toHaveBeenLastCalledWith({ page: 1, size: 20 });
    facade.reloadFromFirstPage();
    expect(repository.load).toHaveBeenLastCalledWith({ page: 0, size: 20 });
  });

  it('shows an error when the batches cannot be loaded', () => {
    repository.load.mockReturnValue(throwError(() => new Error('500')));
    const facade = createFacade();
    expect(facade.error()).toBe('Não foi possível carregar os lotes. Tente novamente.');
  });

  it('applies the permission rules of the session', () => {
    const facade = createFacade();
    expect(facade.canCreate()).toBe(true);
    expect(facade.canAddStageTo(batch)).toBe(true);
    role.set('auditor');
    expect(facade.canCreate()).toBe(false);
    expect(facade.canAddStageTo(batch)).toBe(false);
  });
});
