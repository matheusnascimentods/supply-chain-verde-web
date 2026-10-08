import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ViaCepService } from '../../../../../core/integrations/via-cep/index.service';
import { NewSupplier } from '../../../../suppliers';
import { NewSupplierFormComponent } from './index.component';

describe('NewSupplierFormComponent', () => {
  let fixture: ComponentFixture<NewSupplierFormComponent>;
  let viaCep: { lookup: ReturnType<typeof vi.fn> };
  let submitted: NewSupplier[];

  beforeEach(() => {
    submitted = [];
    viaCep = { lookup: vi.fn().mockReturnValue(of({ logradouro: 'Avenida Paulista', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'SP' })) };
    TestBed.configureTestingModule({ providers: [{ provide: ViaCepService, useValue: viaCep }] });
    fixture = TestBed.createComponent(NewSupplierFormComponent);
    fixture.componentInstance.submitted.subscribe((supplier) => submitted.push(supplier));
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('formats CNPJ, phone and zip code while typing and emits the supplier', () => {
    const form = fixture.componentInstance.form;
    form.setValue({ name: 'Fazenda Verde', cnpj: '12345678000190', phone: '11999999999', street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000000', city: 'São Paulo', state: 'SP' });
    expect(form.controls.cnpj.value).toBe('12.345.678/0001-90');
    expect(form.controls.phone.value).toBe('(11) 99999-9999');
    fixture.componentInstance.submit();
    expect(submitted[0]).toEqual({
      name: 'Fazenda Verde',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 99999-9999',
      address: { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000-000', city: 'São Paulo', state: 'SP' },
    });
  });

  it('looks up the zip code and fills the address', () => {
    vi.useFakeTimers();
    const form = fixture.componentInstance.form;
    form.controls.zipCode.setValue('01000000');
    vi.advanceTimersByTime(350);
    expect(viaCep.lookup).toHaveBeenCalledWith('01000000');
    expect(form.controls.street.value).toBe('Avenida Paulista');
    expect(form.controls.state.value).toBe('SP');
    expect(fixture.componentInstance.cepMessage()).toBe('Endereço localizado. Confira os dados antes de salvar.');
  });

  it('tells when the zip code was not found', () => {
    vi.useFakeTimers();
    viaCep.lookup.mockReturnValue(of({ erro: true }));
    fixture.componentInstance.form.controls.zipCode.setValue('99999999');
    vi.advanceTimersByTime(350);
    expect(fixture.componentInstance.cepMessage()).toBe('CEP não encontrado. Confira o número ou preencha o endereço manualmente.');
  });
});
