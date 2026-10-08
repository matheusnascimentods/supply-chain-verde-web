import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReportsRepository } from '../../infrastructure/report/index.repository';
import { SuppliersRepository } from '../../infrastructure/index.repository';
import { CreateSupplierUseCase } from './create-supplier/index.use-case';
import { GenerateReportUseCase } from './generate-report/index.use-case';
import { UpdateSupplierUseCase } from './update-supplier/index.use-case';

describe('suppliers use cases', () => {
  const address = { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000-000', city: 'SP', state: 'SP' };
  const formatted = { name: 'Fazenda', cnpj: '12.345.678/0001-90', phone: '(11) 3333-2000', address };
  const normalized = { ...formatted, cnpj: '12345678000190', phone: '1133332000' };
  let suppliers: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let reports: { generate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    suppliers = { create: vi.fn().mockReturnValue(of({})), update: vi.fn().mockReturnValue(of({})) };
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

  it('generates a report for the supplier and period', () => {
    const period = { periodStartAt: '2026-01-01', periodEndAt: '2026-01-31' };
    TestBed.inject(GenerateReportUseCase).execute(9, period).subscribe();
    expect(reports.generate).toHaveBeenCalledWith(9, period);
  });
});
