import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BatchCreationFacade } from '../../../application/create-batch/index.facade';
import { BatchCreateModalComponent } from './index.component';

describe('BatchCreateModalComponent', () => {
  let fixture: ComponentFixture<BatchCreateModalComponent>;
  let facade: ReturnType<typeof createFacade>;
  let created: number;
  const coffee = { productId: 3, name: 'Café orgânico', category: 'AGRICULTURE', unit: 'KG' };

  function createFacade() {
    return {
      step: signal<0 | 1 | 2 | 3>(0),
      saving: signal(false),
      error: signal(''),
      category: signal<string | null>(null),
      unit: signal<string | null>(null),
      unitSymbol: signal('kg'),
      suppliers: { items: signal([]), page: signal(0), totalPages: signal(0), search: signal(''), loading: signal(false), searchFor: vi.fn(), changePage: vi.fn() },
      selectedSupplier: signal<object | null>({ supplierId: 9, name: 'Fazenda Verde' }),
      supplierProducts: signal<object[]>([]),
      loadingProducts: signal(false),
      selectedProduct: signal<object | null>(coffee),
      setCategory: vi.fn(),
      setUnit: vi.fn(),
      selectSupplier: vi.fn(),
      selectProduct: vi.fn(),
      next: vi.fn(),
      previous: vi.fn(),
      retrySuppliers: vi.fn(),
      submit: vi.fn().mockReturnValue(of({ batchId: 77 })),
    };
  }

  beforeEach(() => {
    created = 0;
    facade = createFacade();
    TestBed.overrideComponent(BatchCreateModalComponent, { set: { providers: [{ provide: BatchCreationFacade, useValue: facade }] } });
    fixture = TestBed.createComponent(BatchCreateModalComponent);
    fixture.componentInstance.created.subscribe(() => created++);
    fixture.detectChanges();
  });

  const element = () => fixture.nativeElement as HTMLElement;
  const show = (step: 0 | 1 | 2 | 3) => {
    facade.step.set(step);
    fixture.detectChanges();
  };

  it('shows the four steps of the request', () => {
    const steps = [...element().querySelectorAll('.create-step')].map((step) => step.textContent?.replace(/\s+/g, ' ').trim());
    expect(steps).toEqual(['1Produto', '2Fornecedor', '3Produto do fornecedor', '4Revisão']);
  });

  it('asks only category and unit in the first step, with no catalog, no inline creation and no production date', () => {
    const page = element();
    expect(page.querySelector('#batch-category')).not.toBeNull();
    expect(page.querySelector('#batch-unit')).not.toBeNull();
    expect(page.querySelector('input[type="date"]')).toBeNull();
    expect(page.textContent).not.toContain('Data de produção');

    const category = page.querySelector<HTMLSelectElement>('#batch-category')!;
    category.value = 'AGRICULTURE';
    category.dispatchEvent(new Event('change'));
    expect(facade.setCategory).toHaveBeenCalledWith('AGRICULTURE');
  });

  it('lists the products of the chosen supplier in the third step, and explains when there are none', () => {
    facade.supplierProducts.set([coffee]);
    show(2);
    expect(element().textContent).toContain('Produtos de Fazenda Verde');
    expect(element().textContent).toContain('Café orgânico');

    facade.supplierProducts.set([]);
    fixture.detectChanges();
    expect(element().querySelector('[data-testid="no-supplier-products"]')).not.toBeNull();
  });

  it('asks the quantity in the review and requests the batch', () => {
    show(3);
    expect(element().textContent).toContain('Revise o pedido');
    fixture.componentInstance.submit();
    expect(facade.submit).not.toHaveBeenCalled();
    fixture.detectChanges();
    expect(element().textContent).toContain('Informe uma quantidade maior que zero.');

    fixture.componentInstance.quantity.setValue(250);
    fixture.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalledWith(250);
    expect(created).toBe(1);
  });

  it('stays open when the request fails', () => {
    facade.submit.mockReturnValue(throwError(() => new Error('400')));
    show(3);
    fixture.componentInstance.quantity.setValue(10);
    fixture.componentInstance.submit();
    expect(created).toBe(0);
  });

  it('does not submit before the review step', () => {
    fixture.componentInstance.quantity.setValue(10);
    fixture.componentInstance.submit();
    expect(facade.submit).not.toHaveBeenCalled();
  });

  it('does not close while the batch is being requested', () => {
    let dismissed = 0;
    fixture.componentInstance.dismiss.subscribe(() => dismissed++);
    facade.saving.set(true);
    fixture.componentInstance.requestDismiss();
    expect(dismissed).toBe(0);
    facade.saving.set(false);
    fixture.componentInstance.requestDismiss();
    expect(dismissed).toBe(1);
  });
});
