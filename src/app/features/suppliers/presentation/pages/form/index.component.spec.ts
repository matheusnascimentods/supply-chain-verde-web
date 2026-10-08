import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { UpdateSupplierUseCase } from '../../../application/use-cases/update-supplier/index.use-case';
import { SuppliersRepository } from '../../../infrastructure/index.repository';
import { SupplierFormComponent } from './index.component';

@Component({ template: '' })
class SupplierListPage {}

describe('SupplierFormComponent', () => {
  let fixture: ComponentFixture<SupplierFormComponent>;
  let repository: { get: ReturnType<typeof vi.fn> };
  let updateSupplier: { execute: ReturnType<typeof vi.fn> };
  const supplier = {
    supplierId: 8,
    name: 'Fazenda Verde',
    cnpj: '12345678000190',
    phone: '1633332023',
    address: { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: null, zipCode: '01000000', city: 'São Paulo', state: 'SP' },
  };

  function create(params: Record<string, string>, userId: number | null = null): SupplierFormComponent {
    repository = { get: vi.fn().mockReturnValue(of(supplier)) };
    updateSupplier = { execute: vi.fn().mockReturnValue(of(supplier)) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'suppliers', component: SupplierListPage }]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
        { provide: SessionService, useValue: { userId: () => userId } },
        { provide: SuppliersRepository, useValue: repository },
        { provide: UpdateSupplierUseCase, useValue: updateSupplier },
      ],
    });
    fixture = TestBed.createComponent(SupplierFormComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('loads the supplier from the URL and formats CNPJ, phone and zip code', () => {
    const component = create({ id: '8' });
    expect(repository.get).toHaveBeenCalledWith(8);
    expect(component.form.controls.cnpj.value).toBe('12.345.678/0001-90');
    expect(component.form.controls.phone.value).toBe('(16) 3333-2023');
    expect(component.form.controls.zipCode.value).toBe('01000-000');
  });

  it('edits the supplier of the session on /suppliers/me', () => {
    create({}, 9);
    expect(repository.get).toHaveBeenCalledWith(9);
  });

  it('explains when the supplier of the session cannot be identified', () => {
    const component = create({});
    expect(repository.get).not.toHaveBeenCalled();
    expect(component.error()).toBe('Não foi possível identificar o fornecedor desta sessão.');
  });

  it('saves the changes and goes back to the list', () => {
    const component = create({ id: '8' });
    component.submit();
    expect(updateSupplier.execute).toHaveBeenCalledWith(8, {
      name: 'Fazenda Verde',
      cnpj: '12.345.678/0001-90',
      phone: '(16) 3333-2023',
      address: { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000-000', city: 'São Paulo', state: 'SP' },
    });
  });

  it('shows an error when saving fails', () => {
    const component = create({ id: '8' });
    updateSupplier.execute.mockReturnValue(throwError(() => new Error('500')));
    component.submit();
    expect(component.error()).toBe('Não foi possível salvar. Confira os dados e tente novamente.');
    expect(component.saving()).toBe(false);
  });
});
