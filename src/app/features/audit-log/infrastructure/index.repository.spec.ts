import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { AuditLogRepository } from './index.repository';

describe('AuditLogRepository', () => {
  let repository: AuditLogRepository;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/audit-logs`;
  const log = { logId: 1, userId: 2, userEmail: 'ana@example.com', action: 'UPDATE', affectedTable: 'suppliers', affectedEntityId: 3, beforeData: null, afterData: { name: 'X' }, performedAt: '2026-10-01T10:00:00' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(AuditLogRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the period, the optional filters and the page', () => {
    repository.load({ startDate: '2026-10-01', endDate: '2026-10-07', action: 'UPDATE', email: ' ana@ ' }, { limit: 20, offset: 40 })
      .subscribe((page) => expect(page).toEqual({ items: [log], hasNext: true, totalPages: 3 }));
    const request = http.expectOne((req) => req.url === base);
    expect(request.request.params.get('from')).toBe('2026-10-01');
    expect(request.request.params.get('to')).toBe('2026-10-07');
    expect(request.request.params.get('action')).toBe('UPDATE');
    expect(request.request.params.get('userEmail')).toBe('ana@');
    expect(request.request.params.get('offset')).toBe('40');
    request.flush({ items: [log], limit: 20, offset: 40, hasNext: true, totalPages: 3 });
  });

  it('omits empty filters', () => {
    repository.load({ startDate: '2026-10-01', endDate: '2026-10-07', action: '', email: '  ' }, { limit: 20, offset: 0 }).subscribe();
    const request = http.expectOne((req) => req.url === base);
    expect(request.request.params.has('action')).toBe(false);
    expect(request.request.params.has('userEmail')).toBe(false);
    request.flush({ items: [], limit: 20, offset: 0, hasNext: false, totalPages: 0 });
  });

  it('rejects a response outside the paginated envelope', () => {
    let failed = false;
    repository.load({ startDate: '2026-10-01', endDate: '2026-10-07', action: '', email: '' }, { limit: 20, offset: 0 }).subscribe({ error: () => (failed = true) });
    http.expectOne((req) => req.url === base).flush([log]);
    expect(failed).toBe(true);
  });
});
