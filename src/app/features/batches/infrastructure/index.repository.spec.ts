import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { BatchesRepository } from './index.repository';

describe('BatchesRepository', () => {
  let repository: BatchesRepository;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/batches`;
  const batch = {
    batchId: 7, productId: 3, productName: 'Café', supplierId: 9, supplierName: 'Fazenda Verde',
    quantity: 250, producedAt: '2026-05-20', currentStage: null, stages: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(BatchesRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads a page of batches', () => {
    repository.load({ page: 1, size: 20 }).subscribe((page) => {
      expect(page).toEqual({ items: [batch], page: 1, totalPages: 3, totalElements: 41 });
    });
    const request = http.expectOne(`${base}?page=1&size=20`);
    request.flush({ content: [batch], page: 1, size: 20, totalElements: 41, totalPages: 3 });
  });

  it('creates a batch', () => {
    const newBatch = { productId: 3, supplierId: 9, quantity: 250, producedAt: '2026-05-20' };
    repository.create(newBatch).subscribe((created) => expect(created.batchId).toBe(7));
    const request = http.expectOne(base);
    expect(request.request.body).toEqual(newBatch);
    request.flush(batch);
  });
});
