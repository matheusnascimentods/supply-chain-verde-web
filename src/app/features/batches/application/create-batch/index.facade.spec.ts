import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { CurrentUserService } from '../../../../core/auth/session/current-user/index.service';
import { SessionService } from '../../../../core/auth/session/index.service';
import { SuppliersRepository } from '../../../suppliers';
import { ProductsRepository } from '../../infrastructure/product/index.repository';
import { CreateBatchError, CreateBatchUseCase } from '../use-cases/create-batch/index.use-case';
import { BatchCreationFacade } from './index.facade';

describe('BatchCreationFacade', () => {
  const product = { productId: 11, name: 'Café', category: 'AGRICULTURE' as const, unit: 'KG' as const };
  const supplier = { supplierId: 22, name: 'Fazenda Verde' };
  const newProduct = { name: ' Café ', description: '', category: 'AGRICULTURE' as const, unit: 'KG' as const };
  const address = { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000-000', city: 'SP', state: 'SP' };
  const newSupplier = { name: 'Fazenda', cnpj: '12345678000190', phone: '11999999999', address };
  let products: { load: ReturnType<typeof vi.fn> };
  let suppliers: { loadRanking: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };
  let createBatch: { execute: ReturnType<typeof vi.fn> };

  function createFacade(role: string): BatchCreationFacade {
    TestBed.configureTestingModule({
      providers: [
        BatchCreationFacade,
        { provide: SessionService, useValue: { role: () => role } },
        { provide: ProductsRepository, useValue: products },
        { provide: SuppliersRepository, useValue: suppliers },
        { provide: CurrentUserService, useValue: { load: vi.fn().mockReturnValue(of({ userId: 22 })) } },
        { provide: CreateBatchUseCase, useValue: createBatch },
      ],
    });
    const facade = TestBed.inject(BatchCreationFacade);
    TestBed.tick();
    return facade;
  }

  beforeEach(() => {
    products = { load: vi.fn().mockReturnValue(of({ items: [product], totalPages: 1 })) };
    suppliers = {
      loadRanking: vi.fn().mockReturnValue(of({ items: [supplier], totalPages: 1 })),
      get: vi.fn().mockReturnValue(of(supplier)),
    };
    createBatch = { execute: vi.fn().mockReturnValue(of({ step: 'batch', batch: { batchId: 1 } })) };
  });

  it('loads products and the supplier ranking for administrators', () => {
    const facade = createFacade('admin');
    expect(facade.products.items()).toEqual([product]);
    expect(facade.suppliers.items()).toEqual([supplier]);
  });

  it('reloads the supplier ranking with the chosen product as criteria', () => {
    const facade = createFacade('admin');
    expect(suppliers.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '' }, undefined);

    facade.selectProduct(product);
    TestBed.tick();
    expect(suppliers.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '' }, { productId: 11 });

    facade.useNewProduct(newProduct);
    TestBed.tick();
    expect(suppliers.loadRanking).toHaveBeenLastCalledWith(
      { limit: 20, offset: 0, search: '' },
      { category: 'AGRICULTURE', unit: 'KG' },
    );

    facade.useNewProduct({ ...newProduct, name: 'Outro café' });
    TestBed.tick();
    expect(suppliers.loadRanking).toHaveBeenCalledTimes(3);
  });

  it('preselects the supplier linked to a supplier account', () => {
    const facade = createFacade('supplier');
    expect(suppliers.loadRanking).not.toHaveBeenCalled();
    expect(suppliers.get).toHaveBeenCalledWith(22);
    expect(facade.ownSupplier()).toEqual(supplier);
    expect(facade.hasSupplierChoice()).toBe(true);
  });

  it('requires a product and valid batch data before advancing', () => {
    const facade = createFacade('admin');
    expect(facade.next(true)).toBe(false);
    expect(facade.error()).toBe('Selecione ou preencha um produto para continuar.');
    facade.selectProduct(product);
    expect(facade.next(false)).toBe(false);
    expect(facade.error()).toBe('Informe uma quantidade maior que zero e a data de produção.');
    expect(facade.next(true)).toBe(true);
    expect(facade.step()).toBe(1);
  });

  it('submits new product and supplier as drafts', () => {
    const facade = createFacade('admin');
    facade.useNewProduct(newProduct);
    facade.useNewSupplier(newSupplier);
    facade.submit({ quantity: 250, producedAt: '2026-10-05' }).subscribe();
    expect(createBatch.execute).toHaveBeenCalledWith({
      product: { ...newProduct, name: 'Café' },
      supplier: newSupplier,
      quantity: 250,
      producedAt: '2026-10-05',
    });
    expect(facade.saving()).toBe(false);
  });

  it('keeps a created product for the next attempt when the supplier fails', () => {
    const facade = createFacade('admin');
    facade.useNewProduct(newProduct);
    facade.useNewSupplier(newSupplier);
    createBatch.execute.mockReturnValueOnce(
      new Observable((subscriber) => {
        subscriber.next({ step: 'product', product });
        subscriber.error(new CreateBatchError('supplier'));
      }),
    );

    facade.submit({ quantity: 10, producedAt: '2026-10-05' }).subscribe({ error: () => undefined });
    expect(facade.createdProduct()).toEqual(product);
    expect(facade.hasPartialCreation()).toBe(true);
    expect(facade.error()).toBe('Não foi possível cadastrar o fornecedor. O produto já salvo foi mantido para a próxima tentativa.');

    facade.submit({ quantity: 10, producedAt: '2026-10-05' }).subscribe();
    expect(createBatch.execute).toHaveBeenLastCalledWith(expect.objectContaining({ product, supplier: newSupplier }));
  });

  it('shows the message of the failing step', () => {
    createBatch.execute.mockReturnValue(throwError(() => new CreateBatchError('batch')));
    const facade = createFacade('admin');
    facade.selectProduct(product);
    facade.selectSupplier(supplier);
    facade.submit({ quantity: 1, producedAt: '2026-10-05' }).subscribe({ error: () => undefined });
    expect(facade.error()).toBe('Não foi possível criar o lote. Os cadastros já salvos foram preservados; tente novamente.');
    expect(createBatch.execute).toHaveBeenCalledWith(expect.objectContaining({ product, supplier: { supplierId: 22 } }));
  });
});
