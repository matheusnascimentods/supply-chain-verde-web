import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserRole } from '../../../core/auth/session/index.model';
import { SessionService } from '../../../core/auth/session/index.service';
import { SupplierRanking } from '../domain/index.model';
import { SuppliersRepository } from '../infrastructure/index.repository';
import { SuppliersListFacade } from './index.facade';

describe('SuppliersListFacade', () => {
  const supplier = (supplierId: number, extra: Partial<SupplierRanking> = {}): SupplierRanking => ({
    supplierId,
    name: `Fornecedor ${supplierId}`,
    sustainabilityScore: 100 - supplierId,
    activeCertificationCount: 1,
    totalCo2Kg: 10,
    reportCount: 0,
    certifications: [],
    ...extra,
  });
  const five = [1, 2, 3, 4, 5].map((id) => supplier(id));
  const role = signal<UserRole | null>('admin');
  let userId: number | null;
  let repository: { loadRanking: ReturnType<typeof vi.fn> };

  function createFacade(): SuppliersListFacade {
    TestBed.configureTestingModule({
      providers: [
        SuppliersListFacade,
        { provide: SuppliersRepository, useValue: repository },
        { provide: SessionService, useValue: { role, userId: () => userId } },
      ],
    });
    return TestBed.inject(SuppliersListFacade);
  }

  beforeEach(() => {
    role.set('admin');
    userId = null;
    repository = { loadRanking: vi.fn().mockReturnValue(of({ items: five, totalPages: 2 })) };
  });

  afterEach(() => vi.useRealTimers());

  it('splits the first page between podium and table', () => {
    const facade = createFacade();
    expect(repository.loadRanking).toHaveBeenCalledWith({ limit: 20, offset: 0, search: '' });
    expect(facade.podium().map((item) => item.supplierId)).toEqual([1, 2, 3]);
    expect(facade.tableItems().map((item) => item.supplierId)).toEqual([4, 5]);
    expect(facade.firstTablePosition()).toBe(4);
  });

  it('shows everything in the table on later pages', () => {
    const facade = createFacade();
    facade.nextPage();
    expect(repository.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 20, search: '' });
    expect(facade.podium()).toEqual([]);
    expect(facade.tableItems().length).toBe(5);
    expect(facade.firstTablePosition()).toBe(21);
  });

  it('debounces the search and hides the podium while searching', () => {
    vi.useFakeTimers();
    const facade = createFacade();
    facade.searchFor('verde');
    vi.advanceTimersByTime(300);
    expect(repository.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: 'verde' });
    expect(facade.podium()).toEqual([]);
  });

  it('shows an error message when the ranking fails', () => {
    repository.loadRanking.mockReturnValue(throwError(() => new Error('500')));
    const facade = createFacade();
    expect(facade.error()).toBe('Não foi possível carregar os fornecedores e o ranking. Tente novamente.');
    expect(facade.loading()).toBe(false);
  });

  it('refreshes the supplier shown in the certifications modal after reloading', () => {
    const facade = createFacade();
    facade.certificationsSupplier.set(five[1]);
    const updated = supplier(2, { activeCertificationCount: 5 });
    repository.loadRanking.mockReturnValue(of({ items: [five[0], updated], totalPages: 1 }));
    facade.load();
    expect(facade.certificationsSupplier()).toEqual(updated);
  });

  it('applies the permission rules of the current session', () => {
    role.set('supplier');
    userId = 2;
    const facade = createFacade();
    expect(facade.canManage()).toBe(false);
    expect(facade.canOpenReports(five[1])).toBe(true);
    expect(facade.canOpenReports(five[0])).toBe(false);
    expect(facade.canCreateCertificationFor(five[1])).toBe(true);
  });
});
