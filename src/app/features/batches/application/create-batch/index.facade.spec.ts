import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductsRepository } from '../../../products';
import { CreateBatchUseCase } from '../use-cases/create-batch/index.use-case';
import { BatchCreationFacade } from './index.facade';

describe('BatchCreationFacade', () => {
  const coffee = { productId: 3, supplierId: 9, supplierName: 'Fazenda Verde', name: 'Café orgânico', category: 'AGRICULTURE' as const, unit: 'KG' as const };
  let products: { load: ReturnType<typeof vi.fn> };
  let createBatch: { execute: ReturnType<typeof vi.fn> };

  function createFacade(): BatchCreationFacade {
    TestBed.configureTestingModule({
      providers: [
        BatchCreationFacade,
        { provide: ProductsRepository, useValue: products },
        { provide: CreateBatchUseCase, useValue: createBatch },
      ],
    });
    return TestBed.inject(BatchCreationFacade);
  }

  beforeEach(() => {
    products = { load: vi.fn().mockReturnValue(of({ items: [coffee], totalPages: 1 })) };
    createBatch = { execute: vi.fn().mockReturnValue(of({ batchId: 77, status: 'PENDING' })) };
  });

  it('loads the whole catalog on creation, with no filter', () => {
    const facade = createFacade();
    expect(products.load).toHaveBeenCalledWith({ limit: 20, offset: 0, search: '', category: undefined, unit: undefined });
    expect(facade.products.items()).toEqual([coffee]);
  });

  it('reloads from the first page and clears the selection when a filter changes', () => {
    const facade = createFacade();
    facade.selectProduct(coffee);
    facade.setCategory('AGRICULTURE');
    expect(facade.selectedProduct()).toBeNull();
    expect(products.load).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '', category: 'AGRICULTURE', unit: undefined });

    facade.selectProduct(coffee);
    facade.setUnit('TON');
    expect(facade.selectedProduct()).toBeNull();
    expect(products.load).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '', category: 'AGRICULTURE', unit: 'TON' });

    facade.setCategory(null);
    expect(products.load).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '', category: undefined, unit: 'TON' });
  });

  it('clears the selection when the search changes', () => {
    const facade = createFacade();
    facade.selectProduct(coffee);
    facade.searchFor('serra');
    expect(facade.selectedProduct()).toBeNull();
    expect(facade.products.search()).toBe('serra');
  });

  it('does not advance without a product', () => {
    const facade = createFacade();
    expect(facade.next()).toBe(false);
    expect(facade.error()).toBe('Selecione um produto para continuar.');
    facade.selectProduct(coffee);
    expect(facade.next()).toBe(true);
    expect(facade.step()).toBe(1);
    expect(facade.unitSymbol()).toBe('kg');
    facade.previous();
    expect(facade.step()).toBe(0);
  });

  it('explains when the catalog cannot be loaded, and retries', () => {
    products.load.mockReturnValue(throwError(() => new Error('500')));
    const facade = createFacade();
    expect(facade.error()).toBe('Não foi possível carregar os produtos. Tente novamente.');
    products.load.mockReturnValue(of({ items: [coffee], totalPages: 1 }));
    facade.retryProducts();
    expect(facade.error()).toBe('');
    expect(facade.products.items()).toEqual([coffee]);
  });

  it('requests the batch with the product, its supplier and the quantity', () => {
    const facade = createFacade();
    facade.selectProduct(coffee);
    facade.next();
    let created: unknown;
    facade.submit(250).subscribe((batch) => (created = batch));
    expect(createBatch.execute).toHaveBeenCalledWith({ productId: 3, supplierId: 9, quantity: 250 });
    expect(created).toEqual({ batchId: 77, status: 'PENDING' });
    expect(facade.saving()).toBe(false);
  });

  it('shows the API message when the request is refused', () => {
    createBatch.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'O produto 3 não é do fornecedor 9.' } })),
    );
    const facade = createFacade();
    facade.selectProduct(coffee);
    facade.submit(1).subscribe({ error: () => undefined });
    expect(facade.error()).toBe('O produto 3 não é do fornecedor 9.');
    expect(facade.saving()).toBe(false);
  });
});
