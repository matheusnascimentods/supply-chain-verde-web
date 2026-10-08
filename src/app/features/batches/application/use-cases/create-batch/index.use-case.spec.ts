import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateSupplierUseCase } from '../../../../suppliers';
import { BatchesRepository } from '../../../infrastructure/index.repository';
import { ProductsRepository } from '../../../infrastructure/product/index.repository';
import { BatchDraft, CreateBatchError, CreateBatchProgress, CreateBatchUseCase } from './index.use-case';

describe('CreateBatchUseCase', () => {
  const newProduct = { name: 'Café', description: '', category: 'AGRICULTURE' as const, unit: 'KG' as const };
  const address = { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000-000', city: 'SP', state: 'SP' };
  const newSupplier = { name: 'Fazenda', cnpj: '12345678000190', phone: '11999999999', address };
  let products: { create: ReturnType<typeof vi.fn> };
  let suppliers: { execute: ReturnType<typeof vi.fn> };
  let batches: { create: ReturnType<typeof vi.fn> };
  let useCase: CreateBatchUseCase;

  beforeEach(() => {
    products = { create: vi.fn().mockReturnValue(of({ productId: 11, ...newProduct })) };
    suppliers = { execute: vi.fn().mockReturnValue(of({ supplierId: 22, name: 'Fazenda' })) };
    batches = { create: vi.fn().mockReturnValue(of({ batchId: 1 })) };
    TestBed.configureTestingModule({
      providers: [
        { provide: ProductsRepository, useValue: products },
        { provide: CreateSupplierUseCase, useValue: suppliers },
        { provide: BatchesRepository, useValue: batches },
      ],
    });
    useCase = TestBed.inject(CreateBatchUseCase);
  });

  function run(draft: BatchDraft): { events: CreateBatchProgress[]; error?: CreateBatchError } {
    const result: { events: CreateBatchProgress[]; error?: CreateBatchError } = { events: [] };
    useCase.execute(draft).subscribe({ next: (event) => result.events.push(event), error: (error) => (result.error = error) });
    return result;
  }

  it('creates product, supplier and batch in order using the returned ids', () => {
    const { events } = run({ product: newProduct, supplier: newSupplier, quantity: 250, producedAt: '2026-10-05' });
    expect(events.map((event) => event.step)).toEqual(['product', 'supplier', 'batch']);
    expect(batches.create).toHaveBeenCalledWith({ productId: 11, supplierId: 22, quantity: 250, producedAt: '2026-10-05' });
  });

  it('only creates the batch when product and supplier already exist', () => {
    const { events } = run({ product: { productId: 3 }, supplier: { supplierId: 9 }, quantity: 1, producedAt: '2026-10-05' });
    expect(products.create).not.toHaveBeenCalled();
    expect(suppliers.execute).not.toHaveBeenCalled();
    expect(events.map((event) => event.step)).toEqual(['batch']);
  });

  it('reports the failing step and stops the sequence', () => {
    suppliers.execute.mockReturnValue(throwError(() => new Error('500')));
    const { events, error } = run({ product: newProduct, supplier: newSupplier, quantity: 1, producedAt: '2026-10-05' });
    expect(events.map((event) => event.step)).toEqual(['product']);
    expect(error).toBeInstanceOf(CreateBatchError);
    expect(error?.step).toBe('supplier');
    expect(batches.create).not.toHaveBeenCalled();
  });
});
