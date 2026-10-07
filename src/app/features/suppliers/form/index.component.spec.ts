import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ViaCepService } from '../../../core/integrations/via-cep/index.service';
import { SuppliersService } from '../index.service';
import { SupplierFormComponent } from './index.component';

@Component({ template: '' })
class SupplierListPage {}

describe('SupplierFormComponent', () => {
  let fixture: ComponentFixture<SupplierFormComponent>;
  let service: {
    create: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      create: vi.fn().mockReturnValue(of({ supplierId: 8, name: 'Fazenda Verde' })),
      get: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [SupplierFormComponent],
      providers: [
        provideRouter([{ path: 'suppliers', component: SupplierListPage }]),
        { provide: SuppliersService, useValue: service },
        { provide: ViaCepService, useValue: { lookup: vi.fn().mockReturnValue(of(null)) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SupplierFormComponent);
    fixture.detectChanges();
  });

  it('formats CNPJ and phone while editing and sends digits only', () => {
    const component = fixture.componentInstance;
    component.form.setValue({
      name: 'Fazenda Verde',
      cnpj: '12345678000190',
      phone: '1633332023',
      street: 'Rua A',
      number: '10',
      neighborhood: 'Centro',
      complement: '',
      zipCode: '01000000',
      city: 'São Paulo',
      state: 'SP',
    });

    expect(component.form.controls.cnpj.value).toBe('12.345.678/0001-90');
    expect(component.form.controls.phone.value).toBe('(16) 3333-2023');
    component.submit();

    expect(service.create).toHaveBeenCalledWith({
      name: 'Fazenda Verde',
      cnpj: '12345678000190',
      phone: '1633332023',
      address: {
        street: 'Rua A',
        number: '10',
        neighborhood: 'Centro',
        complement: '',
        zipCode: '01000-000',
        city: 'São Paulo',
        state: 'SP',
      },
    });
  });
});
