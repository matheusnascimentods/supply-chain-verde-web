import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CurrentUserService } from '../../../../../core/auth/session/current-user/index.service';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { CreateSupplierUseCase } from '../../../application/use-cases/create-supplier/index.use-case';
import { UpdateOwnSupplierUseCase } from '../../../application/use-cases/update-own-supplier/index.use-case';
import { UpdateSupplierUseCase } from '../../../application/use-cases/update-supplier/index.use-case';
import { SuppliersRepository } from '../../../infrastructure/index.repository';
import { SupplierFormComponent } from './index.component';

@Component({ template: '' })
class SupplierListPage {}

describe('SupplierFormComponent', () => {
  let fixture: ComponentFixture<SupplierFormComponent>;
  let repository: { get: ReturnType<typeof vi.fn> };
  let updateSupplier: { execute: ReturnType<typeof vi.fn> };
  let updateOwnSupplier: { execute: ReturnType<typeof vi.fn> };
  let createSupplier: { execute: ReturnType<typeof vi.fn> };
  const supplier = {
    supplierId: 8,
    name: 'Fazenda Verde',
    cnpj: '12345678000190',
    phone: '1633332023',
    address: { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: null, zipCode: '01000000', city: 'São Paulo', state: 'SP' },
  };

  function create(params: Record<string, string>, supplierId: number | null = null, mode?: string): SupplierFormComponent {
    repository = { get: vi.fn().mockReturnValue(of(supplier)) };
    updateSupplier = { execute: vi.fn().mockReturnValue(of(supplier)) };
    updateOwnSupplier = { execute: vi.fn().mockReturnValue(of(supplier)) };
    createSupplier = { execute: vi.fn().mockReturnValue(of(supplier)) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'suppliers', component: SupplierListPage }]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params), data: { mode } } } },
        { provide: SessionService, useValue: { supplierId: () => supplierId } },
        { provide: CurrentUserService, useValue: { load: () => of({ userId: 4, name: 'Ana', email: 'ana@fazenda.com', role: 'supplier' }) } },
        { provide: UpdateOwnSupplierUseCase, useValue: updateOwnSupplier },
        { provide: CreateSupplierUseCase, useValue: createSupplier },
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

  it('edits the supplier of the session on /suppliers/me, with CNPJ and email read-only', () => {
    const component = create({}, 9, 'me');
    expect(repository.get).toHaveBeenCalledWith(9);
    expect(component.form.controls.cnpj.disabled).toBe(true);
    expect(component.account.controls.email.disabled).toBe(true);
    expect(component.account.getRawValue()).toEqual({
      userName: 'Ana',
      email: 'ana@fazenda.com',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  });

  it('saves the own profile through the PATCH use case', () => {
    const component = create({}, 9, 'me');
    component.account.patchValue({ userName: 'Ana S.' });
    component.submit();
    const profile = {
      name: 'Fazenda Verde',
      phone: '(16) 3333-2023',
      address: { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000-000', city: 'São Paulo', state: 'SP' },
    };
    expect(updateOwnSupplier.execute).toHaveBeenCalledWith(
      { ...profile, userName: 'Ana' },
      { ...profile, userName: 'Ana S.' },
      { userName: 'Ana S.', email: 'ana@fazenda.com', currentPassword: '', newPassword: '', confirmPassword: '' },
    );
    expect(updateSupplier.execute).not.toHaveBeenCalled();
  });

  it('blocks the own profile while the password confirmation does not match', () => {
    const component = create({}, 9, 'me');
    component.account.patchValue({ currentPassword: 'atual', newPassword: 'nova', confirmPassword: 'outra' });
    component.submit();
    expect(updateOwnSupplier.execute).not.toHaveBeenCalled();
  });

  it('shows the API message when the current password is wrong', () => {
    const component = create({}, 9, 'me');
    updateOwnSupplier.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Senha atual incorreta.' } })),
    );
    component.account.patchValue({ currentPassword: 'errada', newPassword: 'nova', confirmPassword: 'nova' });
    component.submit();
    expect(component.error()).toBe('Senha atual incorreta.');
  });

  it('explains when the supplier of the session cannot be identified', () => {
    const component = create({}, null, 'me');
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

  describe('new supplier', () => {
    const address = { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000-000', city: 'São Paulo', state: 'SP' };
    const fillCompany = (component: SupplierFormComponent) =>
      component.form.setValue({ name: 'Fazenda Verde', cnpj: '12345678000190', phone: '1633332023', ...address });

    it('creates the supplier without access by default', () => {
      const component = create({}, null, 'new');
      expect(repository.get).not.toHaveBeenCalled();
      expect(component.error()).toBe('');
      fillCompany(component);
      component.submit();
      expect(createSupplier.execute).toHaveBeenCalledWith({
        name: 'Fazenda Verde',
        cnpj: '12.345.678/0001-90',
        phone: '(16) 3333-2023',
        address,
      });
    });

    it('requires and sends the access data when it is enabled', () => {
      const component = create({}, null, 'new');
      fillCompany(component);
      component.withAccess.setValue(true);
      component.submit();
      expect(createSupplier.execute).not.toHaveBeenCalled();

      component.access.setValue({ name: 'Ana', email: 'ana@fazenda.com', password: 'secret' });
      component.submit();
      expect(createSupplier.execute).toHaveBeenCalledWith(
        expect.objectContaining({ user: { name: 'Ana', email: 'ana@fazenda.com', password: 'secret' } }),
      );
    });

    it('shows the API conflict message', () => {
      const component = create({}, null, 'new');
      createSupplier.execute.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'Email já cadastrado: ana@fazenda.com' } })),
      );
      fillCompany(component);
      component.submit();
      expect(component.error()).toBe('Email já cadastrado: ana@fazenda.com');
    });
  });
});
