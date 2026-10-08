import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SessionService } from '../../../../core/auth/session/index.service';
import { ProductsService } from '../../../products/index.service';
import { SuppliersRepository } from '../../../suppliers';
import { ViaCepService } from '../../../../core/integrations/via-cep/index.service';
import { CurrentUserService } from '../../../../core/auth/session/current-user/index.service';
import { BatchesService } from '../../index.service';
import { BatchCreateModalComponent } from './index.component';

const product = { productId: 11, name: 'Café', description: '', category: 'AGRICULTURE', unit: 'KG' };
const supplier = { supplierId: 22, name: 'Fazenda Verde', cnpj: '123', sustainabilityScore: 10, reportCount: 0, certifications: [] };
const supplierDetail = { ...supplier, phone: '11999999999', address: null };
const productPage = { items: [product], limit: 20, offset: 0, hasNext: false, totalPages: 1 };
const supplierPage = { items: [supplier], limit: 20, offset: 0, hasNext: false, totalPages: 1 };

describe('BatchCreateModalComponent', () => {
  let fixture: ComponentFixture<BatchCreateModalComponent>;
  let products: { load: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let suppliers: { loadRanking: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };
  let viaCep: { lookup: ReturnType<typeof vi.fn> };
  let batches: { create: ReturnType<typeof vi.fn> };

  async function setup(role = 'admin') {
    products = {
      load: vi.fn().mockReturnValue(of(productPage)),
      create: vi.fn().mockReturnValue(of(product)),
    };
    suppliers = {
      loadRanking: vi.fn().mockReturnValue(of(supplierPage)),
      create: vi.fn().mockReturnValue(of(supplierDetail)),
      get: vi.fn().mockReturnValue(of(supplierDetail)),
    };
    viaCep = { lookup: vi.fn().mockReturnValue(of({ logradouro: 'Avenida Paulista', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'SP' })) };
    batches = { create: vi.fn().mockReturnValue(of({ batchId: 1 })) };
    await TestBed.configureTestingModule({
      imports: [BatchCreateModalComponent],
      providers: [
        { provide: SessionService, useValue: { role: () => role } },
        { provide: ProductsService, useValue: products },
        { provide: SuppliersRepository, useValue: suppliers },
        { provide: ViaCepService, useValue: viaCep },
        { provide: CurrentUserService, useValue: { load: vi.fn().mockReturnValue(of({ userId: 22, name: 'Fazenda', email: 'f@example.com', role: 'supplier' })) } },
        { provide: BatchesService, useValue: batches },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BatchCreateModalComponent);
    fixture.detectChanges();
  }

  it('creates product, supplier, then batch using response IDs', async () => {
    await setup();
    const component = fixture.componentInstance;
    component.productForm.setValue({ name: 'Café', description: 'Orgânico', category: 'AGRICULTURE', unit: 'KG' });
    component.useNewProduct();
    component.batchForm.setValue({ quantity: 250, producedAt: '2026-10-05' });
    component.next();
    component.supplierForm.setValue({ name: 'Fazenda Verde', cnpj: '12345678000190', phone: '11999999999', street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000000', city: 'São Paulo', state: 'SP' });
    expect(component.supplierForm.controls.cnpj.value).toBe('12.345.678/0001-90');
    expect(component.supplierForm.controls.phone.value).toBe('(11) 99999-9999');
    component.useNewSupplier();
    component.next();
    component.submit();

    expect(products.create).toHaveBeenCalledWith({ name: 'Café', description: 'Orgânico', category: 'AGRICULTURE', unit: 'KG' });
    expect(suppliers.create).toHaveBeenCalledWith({ name: 'Fazenda Verde', cnpj: '12345678000190', phone: '11999999999', address: { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000-000', city: 'São Paulo', state: 'SP' } });
    expect(batches.create).toHaveBeenCalledWith({ productId: 11, supplierId: 22, quantity: 250, producedAt: '2026-10-05' });
  });

  it('retains a created product after a supplier request fails so retry does not duplicate it', async () => {
    await setup();
    const component = fixture.componentInstance;
    component.productForm.setValue({ name: 'Café', description: '', category: 'AGRICULTURE', unit: 'KG' });
    component.useNewProduct();
    component.batchForm.setValue({ quantity: 10, producedAt: '2026-10-05' });
    component.next();
    component.supplierForm.setValue({ name: 'Fazenda', cnpj: '123', phone: '1', street: 'Rua', number: '1', neighborhood: 'Centro', complement: '', zipCode: '01000000', city: 'São Paulo', state: 'SP' });
    component.useNewSupplier();
    component.next();
    suppliers.create.mockReturnValueOnce(throwError(() => new Error('failed'))).mockReturnValueOnce(of(supplierDetail));

    component.submit();
    expect(products.create).toHaveBeenCalledTimes(1);
    expect(component.error()).toContain('produto já salvo');
    component.submit();

    expect(products.create).toHaveBeenCalledTimes(1);
    expect(batches.create).toHaveBeenCalledWith({ productId: 11, supplierId: 22, quantity: 10, producedAt: '2026-10-05' });
  });

  it('uses the logged-in supplier and hides inline supplier creation for supplier role', async () => {
    await setup('supplier');
    const component = fixture.componentInstance;
    expect(suppliers.loadRanking).not.toHaveBeenCalled();
    expect(suppliers.get).toHaveBeenCalledWith(22);
    expect(component.isAdmin).toBe(false);
    expect(component.ownSupplier()).toEqual(supplierDetail);
  });

  it('looks up CEP and fills the supplier address while retaining a formatted CEP', async () => {
    await setup();
    const component = fixture.componentInstance;
    component.supplierForm.controls.zipCode.setValue('01000000');
    expect(component.supplierForm.controls.zipCode.value).toBe('01000-000');
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(viaCep.lookup).toHaveBeenCalledWith('01000000');
    expect(component.supplierForm.controls.street.value).toBe('Avenida Paulista');
    expect(component.supplierForm.controls.neighborhood.value).toBe('Bela Vista');
    expect(component.supplierForm.controls.city.value).toBe('São Paulo');
    expect(component.supplierForm.controls.state.value).toBe('SP');
  });
});
