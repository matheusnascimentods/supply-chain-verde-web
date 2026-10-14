import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReportsRepository } from '../../infrastructure/report/index.repository';
import { SuppliersRepository } from '../../infrastructure/index.repository';
import { CreateSupplierUseCase } from './create-supplier/index.use-case';
import { GenerateReportUseCase } from './generate-report/index.use-case';
import { UpdateOwnSupplierUseCase } from './update-own-supplier/index.use-case';
import { UpdateSupplierUseCase } from './update-supplier/index.use-case';

describe('suppliers use cases', () => {
  const address = { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000-000', city: 'SP', state: 'SP' };
  const formatted = { name: 'Fazenda', cnpj: '12.345.678/0001-90', phone: '(11) 3333-2000', address };
  const normalized = { ...formatted, cnpj: '12345678000190', phone: '1133332000' };
  let suppliers: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; updateOwn: ReturnType<typeof vi.fn> };
  let reports: { generate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    suppliers = { create: vi.fn().mockReturnValue(of({})), update: vi.fn().mockReturnValue(of({})), updateOwn: vi.fn().mockReturnValue(of({})) };
    reports = { generate: vi.fn().mockReturnValue(of({})) };
    TestBed.configureTestingModule({
      providers: [
        { provide: SuppliersRepository, useValue: suppliers },
        { provide: ReportsRepository, useValue: reports },
      ],
    });
  });

  it('creates a supplier sending only digits in CNPJ and phone', () => {
    TestBed.inject(CreateSupplierUseCase).execute(formatted).subscribe();
    expect(suppliers.create).toHaveBeenCalledWith(normalized);
  });

  it('updates a supplier sending only digits in CNPJ and phone', () => {
    TestBed.inject(UpdateSupplierUseCase).execute(9, formatted).subscribe();
    expect(suppliers.update).toHaveBeenCalledWith(9, normalized);
  });

  it('creates a supplier with access passing the user block along', () => {
    const user = { name: 'Ana', email: 'ana@fazenda.com', password: 'secret' };
    TestBed.inject(CreateSupplierUseCase).execute({ ...formatted, user }).subscribe();
    expect(suppliers.create).toHaveBeenCalledWith({ ...normalized, user });
  });

  describe('update own supplier', () => {
    const profile = { name: 'Fazenda', phone: '(11) 3333-2000', address, userName: 'Ana' };
    const noPassword = { currentPassword: '', newPassword: '', confirmPassword: '' };

    it('sends only the changed fields, with the phone in digits', () => {
      const current = { ...profile, phone: '(11) 3333-2001', address: { ...address, number: '12' } };
      TestBed.inject(UpdateOwnSupplierUseCase).execute(profile, current, noPassword).subscribe();
      expect(suppliers.updateOwn).toHaveBeenCalledWith({ phone: '1133332001', address: { ...address, number: '12' } });
    });

    it('sends the password only when a new one is typed', () => {
      const useCase = TestBed.inject(UpdateOwnSupplierUseCase);
      useCase.execute(profile, { ...profile, userName: 'Ana S.' }, { ...noPassword, currentPassword: 'atual' }).subscribe();
      expect(suppliers.updateOwn).toHaveBeenLastCalledWith({ userName: 'Ana S.' });
      useCase.execute(profile, profile, { currentPassword: 'atual', newPassword: 'nova', confirmPassword: 'nova' }).subscribe();
      expect(suppliers.updateOwn).toHaveBeenLastCalledWith({ currentPassword: 'atual', newPassword: 'nova' });
    });

    it('skips the request when nothing changed', () => {
      let result: unknown = 'pending';
      TestBed.inject(UpdateOwnSupplierUseCase).execute(profile, { ...profile, phone: '1133332000' }, noPassword).subscribe((value) => (result = value));
      expect(suppliers.updateOwn).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  it('generates a report for the supplier and period', () => {
    const period = { periodStartAt: '2026-01-01', periodEndAt: '2026-01-31' };
    TestBed.inject(GenerateReportUseCase).execute(9, period).subscribe();
    expect(reports.generate).toHaveBeenCalledWith(9, period);
  });
});
