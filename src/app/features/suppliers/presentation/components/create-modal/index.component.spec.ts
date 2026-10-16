import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { ViaCepService } from '../../../../../core/integrations/via-cep/index.service';
import { CreateSupplierUseCase } from '../../../application/use-cases/create-supplier/index.use-case';
import { UpdateSupplierUseCase } from '../../../application/use-cases/update-supplier/index.use-case';
import { SuppliersRepository } from '../../../infrastructure/index.repository';
import { CreateSupplierModalComponent } from './index.component';

describe('CreateSupplierModalComponent', () => {
  let fixture: ComponentFixture<CreateSupplierModalComponent>;
  let createSupplier: { execute: ReturnType<typeof vi.fn> };
  let updateSupplier: { execute: ReturnType<typeof vi.fn> };
  let repository: { get: ReturnType<typeof vi.fn> };
  let saved: number;
  let dismissed: number;
  let viaCep: { lookup: ReturnType<typeof vi.fn> };
  const address = { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000-000', city: 'São Paulo', state: 'SP' };

  function createModal(supplierId: number | null = null): CreateSupplierModalComponent {
    saved = 0;
    dismissed = 0;
    createSupplier = { execute: vi.fn().mockReturnValue(of({})) };
    updateSupplier = { execute: vi.fn().mockReturnValue(of({})) };
    repository = { get: vi.fn().mockReturnValue(of({ supplierId: 8, name: 'Fazenda Azul', cnpj: '11222333000181', phone: '1133334444', address: { ...address, zipCode: '01310100', complement: null } })) };
    viaCep = { lookup: vi.fn().mockReturnValue(of({ logradouro: 'Av. Paulista', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'SP' })) };
    TestBed.configureTestingModule({
      providers: [
        { provide: CreateSupplierUseCase, useValue: createSupplier },
        { provide: UpdateSupplierUseCase, useValue: updateSupplier },
        { provide: SuppliersRepository, useValue: repository },
        { provide: ViaCepService, useValue: viaCep },
      ],
    });
    fixture = TestBed.createComponent(CreateSupplierModalComponent);
    fixture.componentRef.setInput('supplierId', supplierId);
    fixture.componentInstance.saved.subscribe(() => saved++);
    fixture.componentInstance.dismissed.subscribe(() => dismissed++);
    fixture.detectChanges();
    const modal = fixture.componentInstance;
    if (!supplierId) modal.form.setValue({ name: 'Fazenda Verde', cnpj: '12345678000190', phone: '1633332023', ...address });
    return modal;
  }

  it('creates the supplier without access by default and notifies the page', () => {
    const modal = createModal();
    modal.submit();
    expect(createSupplier.execute).toHaveBeenCalledWith({ name: 'Fazenda Verde', cnpj: '12.345.678/0001-90', phone: '(16) 3333-2023', address });
    expect(saved).toBe(1);
  });

  it('loads the supplier, hides the access section and saves the changes', () => {
    vi.useFakeTimers();
    const modal = createModal(8);
    expect(repository.get).toHaveBeenCalledWith(8);
    expect(modal.form.getRawValue()).toEqual({ name: 'Fazenda Azul', cnpj: '11.222.333/0001-81', phone: '(11) 3333-4444', ...address, zipCode: '01310-100' });
    vi.advanceTimersByTime(350);
    expect(viaCep.lookup).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#supplier-with-access')).toBeNull();

    modal.submit();
    expect(updateSupplier.execute).toHaveBeenCalledWith(8, expect.objectContaining({ name: 'Fazenda Azul', cnpj: '11.222.333/0001-81' }));
    expect(createSupplier.execute).not.toHaveBeenCalled();
    expect(saved).toBe(1);
    vi.useRealTimers();
  });

  it('requires and sends the access data when it is enabled', () => {
    const modal = createModal();
    modal.withAccess.setValue(true);
    modal.submit();
    expect(createSupplier.execute).not.toHaveBeenCalled();

    modal.access.setValue({ name: 'Ana', email: 'ana@fazenda.com', password: 'secret' });
    modal.submit();
    expect(createSupplier.execute).toHaveBeenCalledWith(expect.objectContaining({ user: { name: 'Ana', email: 'ana@fazenda.com', password: 'secret' } }));
  });

  it('shows the API conflict message and keeps the modal open', () => {
    const modal = createModal();
    createSupplier.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'Email já cadastrado: ana@fazenda.com' } })),
    );
    modal.submit();
    expect(modal.error()).toBe('Email já cadastrado: ana@fazenda.com');
    expect(modal.saving()).toBe(false);
    expect(saved).toBe(0);
  });

  it('does not close while saving', () => {
    const modal = createModal();
    createSupplier.execute.mockReturnValue(NEVER);
    modal.submit();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector('.shared-modal-backdrop')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(element.querySelector<HTMLButtonElement>('.create-supplier-close')!.disabled).toBe(true);
    expect(dismissed).toBe(0);
  });

  describe('zip code lookup', () => {
    afterEach(() => vi.useRealTimers());

    it('fills the address from the zip code', () => {
      vi.useFakeTimers();
      const modal = createModal();
      modal.form.controls.zipCode.setValue('01310100');
      expect(modal.cepLoading()).toBe(true);
      vi.advanceTimersByTime(350);
      expect(viaCep.lookup).toHaveBeenCalledWith('01310100');
      expect(modal.form.getRawValue()).toEqual(expect.objectContaining({ street: 'Av. Paulista', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP' }));
      expect(modal.cepLoading()).toBe(false);
      expect(modal.cepMessage()).toBe('Endereço localizado. Confira os dados antes de salvar.');
    });

    it('tells when the zip code was not found and clears the message on edit', () => {
      vi.useFakeTimers();
      const modal = createModal();
      viaCep.lookup.mockReturnValue(of({ erro: true }));
      modal.form.controls.zipCode.setValue('99999999');
      vi.advanceTimersByTime(350);
      expect(modal.cepMessage()).toBe('CEP não encontrado. Confira o número ou preencha o endereço manualmente.');
      modal.form.controls.zipCode.setValue('9999999');
      expect(modal.cepMessage()).toBe('');
    });

    it('tells when the lookup fails', () => {
      vi.useFakeTimers();
      const modal = createModal();
      viaCep.lookup.mockReturnValue(throwError(() => new Error('offline')));
      modal.form.controls.zipCode.setValue('01310100');
      vi.advanceTimersByTime(350);
      expect(modal.cepMessage()).toBe('Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.');
    });
  });
});
