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
    marketId: 2, marketName: 'Mercado Bom Preço', status: 'ACTIVE', rejectionReason: null,
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

  it('filters by status and accepts a pending batch without production date', () => {
    const pending = { ...batch, status: 'PENDING', producedAt: null };
    repository.load({ page: 0, size: 20, status: 'PENDING' }).subscribe((page) => expect(page.items).toEqual([pending]));
    http.expectOne(`${base}?page=0&size=20&status=PENDING`).flush({ content: [pending], page: 0, size: 20, totalElements: 1, totalPages: 1 });
  });

  it('reads the rejection reason of a rejected batch', () => {
    const rejected = { ...batch, status: 'REJECTED', rejectionReason: 'Sem capacidade de produção.', producedAt: null };
    repository.load({ page: 0, size: 20, status: null }).subscribe((page) => expect(page.items[0].rejectionReason).toBe('Sem capacidade de produção.'));
    http.expectOne(`${base}?page=0&size=20`).flush({ content: [rejected], page: 0, size: 20, totalElements: 1, totalPages: 1 });
  });

  it('rejects an unknown status', () => {
    let failed = false;
    repository.load({ page: 0, size: 20 }).subscribe({ error: () => (failed = true) });
    http.expectOne(`${base}?page=0&size=20`).flush({ content: [{ ...batch, status: 'LOST' }], page: 0, size: 20, totalElements: 1, totalPages: 1 });
    expect(failed).toBe(true);
  });

  it('rejects a batch with the reason and parses the updated batch', () => {
    let status = '';
    repository.reject(7, 'Sem capacidade de produção.').subscribe((updated) => (status = updated.status));
    const request = http.expectOne(`${base}/7/reject`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ reason: 'Sem capacidade de produção.' });
    request.flush({ ...batch, status: 'REJECTED', rejectionReason: 'Sem capacidade de produção.', producedAt: null });
    expect(status).toBe('REJECTED');
  });

  it('creates a batch', () => {
    const newBatch = { productId: 3, supplierId: 9, quantity: 250, producedAt: '2026-05-20' };
    repository.create(newBatch).subscribe((created) => expect(created.batchId).toBe(7));
    const request = http.expectOne(base);
    expect(request.request.body).toEqual(newBatch);
    request.flush(batch);
  });
});
