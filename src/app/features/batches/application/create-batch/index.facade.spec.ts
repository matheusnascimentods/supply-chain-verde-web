import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductsRepository } from '../../../products';
import { SuppliersRepository } from '../../../suppliers';
import { CreateBatchUseCase } from '../use-cases/create-batch/index.use-case';
import { BatchCreationFacade } from './index.facade';

describe('BatchCreationFacade', () => {
  const coffee = { productId: 3, name: 'Café orgânico', category: 'AGRICULTURE' as const, unit: 'KG' as const };
  const beans = { productId: 4, name: 'Feijão', category: 'AGRICULTURE' as const, unit: 'KG' as const };
  const farm = { supplierId: 9, name: 'Fazenda Verde' } as never;
  let products: { loadBySupplier: ReturnType<typeof vi.fn> };
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

  function toSupplierProducts(facade: BatchCreationFacade): void {
    facade.setCategory('AGRICULTURE');
    facade.setUnit('KG');
    TestBed.tick();
    facade.next();
    facade.selectSupplier(farm);
    facade.next();
  }

  beforeEach(() => {
    products = { loadBySupplier: vi.fn().mockReturnValue(of([coffee, beans])) };
    suppliers = { loadRanking: vi.fn().mockReturnValue(of({ items: [farm], totalPages: 1 })) };
    createBatch = { execute: vi.fn().mockReturnValue(of({ batchId: 77, status: 'PENDING' })) };
  });

  it('loads the supplier ranking only once category and unit are chosen, recommended by them', () => {
    const facade = createFacade();
    expect(suppliers.loadRanking).not.toHaveBeenCalled();
    facade.setCategory('AGRICULTURE');
    TestBed.tick();
    expect(suppliers.loadRanking).not.toHaveBeenCalled();
    facade.setUnit('KG');
    TestBed.tick();
    expect(suppliers.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '' }, { category: 'AGRICULTURE', unit: 'KG' });
  });

  it('clears the chosen supplier when the category or unit changes', () => {
    const facade = createFacade();
    facade.setCategory('AGRICULTURE');
    facade.setUnit('KG');
    TestBed.tick();
    facade.selectSupplier(farm);
    facade.setUnit('TON');
    TestBed.tick();
    expect(facade.selectedSupplier()).toBeNull();
    expect(suppliers.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '' }, { category: 'AGRICULTURE', unit: 'TON' });
  });

  it('requires each step before advancing', () => {
    const facade = createFacade();
    expect(facade.next()).toBe(false);
    expect(facade.error()).toBe('Escolha a categoria e a unidade do produto para continuar.');
    facade.setCategory('AGRICULTURE');
    facade.setUnit('KG');
    TestBed.tick();
    expect(facade.next()).toBe(true);
    expect(facade.next()).toBe(false);
    expect(facade.error()).toBe('Selecione um fornecedor para continuar.');
    facade.selectSupplier(farm);
    expect(facade.next()).toBe(true);
    expect(facade.next()).toBe(false);
    expect(facade.error()).toBe('Selecione um produto do fornecedor para continuar.');
    facade.selectProduct(coffee);
    expect(facade.next()).toBe(true);
    expect(facade.step()).toBe(3);
  });

  it('loads the products of the chosen supplier in that category and unit', () => {
    const facade = createFacade();
    toSupplierProducts(facade);
    expect(products.loadBySupplier).toHaveBeenCalledWith(9, { category: 'AGRICULTURE', unit: 'KG' });
    expect(facade.supplierProducts()).toEqual([coffee, beans]);
    expect(facade.selectedProduct()).toBeNull();
  });

  it('preselects the only product of the supplier', () => {
    products.loadBySupplier.mockReturnValue(of([coffee]));
    const facade = createFacade();
    toSupplierProducts(facade);
    expect(facade.selectedProduct()).toEqual(coffee);
  });

  it('explains when the supplier products cannot be loaded', () => {
    products.loadBySupplier.mockReturnValue(throwError(() => new Error('500')));
    const facade = createFacade();
    toSupplierProducts(facade);
    expect(facade.error()).toBe('Não foi possível carregar os produtos deste fornecedor. Volte e tente novamente.');
    expect(facade.loadingProducts()).toBe(false);
  });

  it('requests the batch with product, supplier and quantity only', () => {
    const facade = createFacade();
    toSupplierProducts(facade);
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
    toSupplierProducts(facade);
    facade.selectProduct(coffee);
    facade.submit(1).subscribe({ error: () => undefined });
    expect(facade.error()).toBe('O produto 3 não é do fornecedor 9.');
    expect(facade.saving()).toBe(false);
  });
});
