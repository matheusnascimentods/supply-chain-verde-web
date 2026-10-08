import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuditLogRepository } from '../infrastructure/index.repository';
import { AuditLogFacade, localDateDaysAgo } from './index.facade';

describe('AuditLogFacade', () => {
  let repository: { load: ReturnType<typeof vi.fn> };
  let facade: AuditLogFacade;

  beforeEach(() => {
    repository = { load: vi.fn().mockReturnValue(of({ items: [], hasNext: true, totalPages: 3 })) };
    TestBed.configureTestingModule({ providers: [AuditLogFacade, { provide: AuditLogRepository, useValue: repository }] });
    facade = TestBed.inject(AuditLogFacade);
  });

  it('computes local dates relative to today', () => {
    expect(localDateDaysAgo(6, new Date(2026, 9, 7, 23, 30))).toBe('2026-10-01');
    expect(localDateDaysAgo(0, new Date(2026, 0, 1, 0, 15))).toBe('2026-01-01');
  });

  it('loads the last 7 days on creation', () => {
    expect(repository.load).toHaveBeenCalledWith(
      { startDate: localDateDaysAgo(6), endDate: localDateDaysAgo(0), action: '', email: '' },
      { limit: 20, offset: 0 },
    );
    expect(facade.pageNumber()).toBe(1);
  });

  it('refuses an inverted period and restarts from the first page when filtering', () => {
    facade.nextPage();
    facade.startDate.set('2026-10-08');
    facade.endDate.set('2026-10-01');
    facade.applyFilters();
    expect(facade.filterError()).toBe('A data inicial deve ser anterior ou igual à data final.');

    facade.startDate.set('2026-09-01');
    facade.action.set('DELETE');
    facade.applyFilters();
    expect(facade.filterError()).toBe('');
    expect(repository.load).toHaveBeenLastCalledWith(expect.objectContaining({ startDate: '2026-09-01', action: 'DELETE' }), { limit: 20, offset: 0 });
  });

  it('shows an error when the records cannot be loaded', () => {
    repository.load.mockReturnValue(throwError(() => new Error('500')));
    facade.load();
    expect(facade.error()).toBe('Não foi possível carregar os registros de auditoria.');
    expect(facade.loading()).toBe(false);
  });
});
