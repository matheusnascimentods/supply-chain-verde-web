import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BatchesRepository } from '../../../infrastructure/index.repository';
import { CreateBatchUseCase } from './index.use-case';

describe('CreateBatchUseCase', () => {
  it('requests the batch with a single POST of product, supplier and quantity', () => {
    const create = vi.fn().mockReturnValue(of({ batchId: 77, status: 'PENDING' }));
    TestBed.configureTestingModule({ providers: [{ provide: BatchesRepository, useValue: { create } }] });
    let created: unknown;

    TestBed.inject(CreateBatchUseCase).execute({ productId: 3, supplierId: 9, quantity: 250 }).subscribe((batch) => (created = batch));

    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith({ productId: 3, supplierId: 9, quantity: 250 });
    expect(created).toEqual({ batchId: 77, status: 'PENDING' });
  });
});
