import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SuppliersRepository } from '../../../suppliers';
import { ProductsRepository } from '../../../products';
import { CreateBatchError, CreateBatchUseCase } from '../use-cases/create-batch/index.use-case';
import { BatchCreationFacade } from './index.facade';

describe('BatchCreationFacade', () => {
  const product = { productId: 11, name: 'Café', category: 'AGRICULTURE' as const, unit: 'KG' as const };
  const supplier = { supplierId: 22, name: 'Fazenda Verde' } as never;
  let products: { load: ReturnType<typeof vi.fn> };
  let suppliers: { loadRanking: ReturnType<typeof vi.fn> };
  let createBatch: { execute: ReturnType<typeof vi.fn> };

  function createFacade(): BatchCreationFacade {
    TestBed.configureTestingModule({
      providers: [
        BatchCreationFacade,
        { provide: ProductsRepository, useValue: products },
        { provide: SuppliersRepository, useValue: suppliers },
        { provide: CreateBatchUseCase, useValue: createBatch },
      ],
    });
    const facade = TestBed.inject(BatchCreationFacade);
    TestBed.tick();
    return facade;
  }

  beforeEach(() => {
    products = { load: vi.fn().mockReturnValue(of({ items: [product], totalPages: 1 })) };
    suppliers = { loadRanking: vi.fn().mockReturnValue(of({ items: [supplier], totalPages: 1 })) };
    createBatch = { execute: vi.fn().mockReturnValue(of({ step: 'batch', batch: { batchId: 1 } })) };
  });

  it('loads the product catalog and the supplier ranking', () => {
    const facade = createFacade();
    expect(facade.products.items()).toEqual([product]);
    expect(facade.suppliers.items()).toEqual([supplier]);
  });

  it('reloads the supplier ranking only when the category or unit of the chosen product changes', () => {
    const facade = createFacade();
    expect(suppliers.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '' }, undefined);

    facade.selectProduct(product);
    TestBed.tick();
    expect(suppliers.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '' }, { category: 'AGRICULTURE', unit: 'KG' });

    facade.selectProduct({ ...product, productId: 12, name: 'Outro café' });
    TestBed.tick();
    expect(suppliers.loadRanking).toHaveBeenCalledTimes(2);

    facade.selectProduct({ ...product, productId: 13, unit: 'TON' });
    TestBed.tick();
    expect(suppliers.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '' }, { category: 'AGRICULTURE', unit: 'TON' });
  });

  it('requires a product and valid batch data, then a supplier, before advancing', () => {
    const facade = createFacade();
    expect(facade.next(true)).toBe(false);
    expect(facade.error()).toBe('Selecione um produto para continuar.');
    facade.selectProduct(product);
    expect(facade.next(false)).toBe(false);
    expect(facade.error()).toBe('Informe uma quantidade maior que zero e a data de produção.');
    expect(facade.next(true)).toBe(true);

    expect(facade.next(true)).toBe(false);
    expect(facade.error()).toBe('Selecione um fornecedor para continuar.');
    facade.selectSupplier(supplier);
    expect(facade.next(true)).toBe(true);
    expect(facade.step()).toBe(2);
  });

  it('creates the batch with the ids of the chosen product and supplier', () => {
    const facade = createFacade();
    facade.selectProduct(product);
    facade.selectSupplier(supplier);
    facade.submit({ quantity: 250, producedAt: '2026-10-05' }).subscribe();
    expect(createBatch.execute).toHaveBeenCalledWith({
      product: { productId: 11 },
      supplier: { supplierId: 22 },
      quantity: 250,
      producedAt: '2026-10-05',
    });
    expect(facade.saving()).toBe(false);
  });

  it('shows an error and stops saving when the batch cannot be created', () => {
    createBatch.execute.mockReturnValue(throwError(() => new Error('500')));
    const facade = createFacade();
    facade.selectProduct(product);
    facade.selectSupplier(supplier);
    facade.submit({ quantity: 1, producedAt: '2026-10-05' }).subscribe({ error: () => undefined });
    expect(facade.error()).toBe('Não foi possível criar o lote. Tente novamente.');
    expect(facade.saving()).toBe(false);
  });

  it('shows the API message when the batch is refused', () => {
    // Como o use case entrega: o HttpErrorResponse vem dentro do CreateBatchError.
    const refused = new HttpErrorResponse({ status: 400, error: { message: 'O produto 11 não é do fornecedor 22.' } });
    createBatch.execute.mockReturnValue(throwError(() => new CreateBatchError('batch', { cause: refused })));
    const facade = createFacade();
    facade.selectProduct(product);
    facade.selectSupplier(supplier);
    facade.submit({ quantity: 1, producedAt: '2026-10-05' }).subscribe({ error: () => undefined });
    expect(facade.error()).toBe('O produto 11 não é do fornecedor 22.');
  });
});
