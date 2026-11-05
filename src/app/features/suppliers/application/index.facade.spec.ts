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
    workedWith: true,
    ...extra,
  });
  const five = [1, 2, 3, 4, 5].map((id) => supplier(id));
  const role = signal<UserRole | null>('admin');
  let supplierId: number | null;
  let repository: { loadRanking: ReturnType<typeof vi.fn> };

  function createFacade(): SuppliersListFacade {
    TestBed.configureTestingModule({
      providers: [
        SuppliersListFacade,
        { provide: SuppliersRepository, useValue: repository },
        { provide: SessionService, useValue: { role, supplierId: () => supplierId } },
      ],
    });
    return TestBed.inject(SuppliersListFacade);
  }

  beforeEach(() => {
    localStorage.clear();
    role.set('admin');
    supplierId = null;
    repository = { loadRanking: vi.fn().mockReturnValue(of({ items: five, totalPages: 2 })) };
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('splits the first page between podium and table', () => {
    const facade = createFacade();
    expect(repository.loadRanking).toHaveBeenCalledWith({ limit: 20, offset: 0, search: '', workedWith: false });
    expect(facade.podium().map((item) => item.supplierId)).toEqual([1, 2, 3]);
    expect(facade.tableItems().map((item) => item.supplierId)).toEqual([4, 5]);
    expect(facade.firstTablePosition()).toBe(4);
  });

  it('shows everything in the table on later pages', () => {
    const facade = createFacade();
    facade.nextPage();
    expect(repository.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 20, search: '', workedWith: false });
    expect(facade.podium()).toEqual([]);
    expect(facade.tableItems().length).toBe(5);
    expect(facade.firstTablePosition()).toBe(21);
  });

  it('debounces the search and hides the podium while searching', () => {
    vi.useFakeTimers();
    const facade = createFacade();
    facade.searchFor('verde');
    vi.advanceTimersByTime(300);
    expect(repository.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: 'verde', workedWith: false });
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
    supplierId = 2;
    const facade = createFacade();
    expect(facade.canOpenReports(five[1])).toBe(true);
    expect(facade.canOpenReports(five[0])).toBe(false);
    expect(facade.canCreateCertificationFor(five[1])).toBe(true);
  });

  it('reloads from the first page with workedWith and remembers the choice', () => {
    const facade = createFacade();
    facade.nextPage();
    facade.setWorkedWithOnly(true);
    expect(repository.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '', workedWith: true });
    expect(localStorage.getItem('suppliers.workedWithOnly')).toBe('true');

    TestBed.resetTestingModule();
    const reopened = createFacade();
    expect(reopened.workedWithOnly()).toBe(true);
    expect(repository.loadRanking).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '', workedWith: true });
  });

  it('starts unfiltered when the storage cannot be read', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const facade = createFacade();
    expect(facade.workedWithOnly()).toBe(false);
    getItem.mockRestore();
  });

  it('opens reports only for suppliers the company worked with', () => {
    const facade = createFacade();
    expect(facade.canOpenReports(supplier(1))).toBe(true);
    expect(facade.canOpenReports(supplier(1, { workedWith: false }))).toBe(false);
  });

  it('has no worked-with filter for the platform admin, even if stored', () => {
    localStorage.setItem('suppliers.workedWithOnly', 'true');
    role.set('platform_admin');
    const facade = createFacade();
    expect(facade.canFilterWorkedWith).toBe(false);
    expect(facade.workedWithOnly()).toBe(false);
  });
});
