import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BatchCreationFacade } from '../../../application/create-batch/index.facade';
import { BatchCreateModalComponent } from './index.component';

describe('BatchCreateModalComponent', () => {
  let fixture: ComponentFixture<BatchCreateModalComponent>;
  let facade: ReturnType<typeof createFacade>;
  let created: number;
  const coffee = { productId: 3, supplierId: 9, supplierName: 'Fazenda Verde', name: 'Café orgânico', category: 'AGRICULTURE', unit: 'KG', co2KgPerUnit: 0.42, acceptedBatchesLast30Days: 3 };
  const rice = { productId: 5, supplierId: 7, supplierName: 'Grãos da Serra', name: 'Arroz', category: 'AGRICULTURE', unit: 'TON', co2KgPerUnit: null, acceptedBatchesLast30Days: 0 };

  function createFacade() {
    return {
      step: signal<0 | 1>(0),
      saving: signal(false),
      error: signal(''),
      category: signal<string | null>(null),
      unit: signal<string | null>(null),
      unitSymbol: signal('kg'),
      products: { items: signal<object[]>([]), page: signal(0), totalPages: signal(0), search: signal(''), loading: signal(false), changePage: vi.fn() },
      selectedProduct: signal<object | null>(coffee),
      setCategory: vi.fn(),
      setUnit: vi.fn(),
      searchFor: vi.fn(),
      selectProduct: vi.fn(),
      next: vi.fn(),
      previous: vi.fn(),
      retryProducts: vi.fn(),
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
  const text = (node: Element | null | undefined) => node?.textContent?.replace(/\s+/g, ' ').trim();
  const show = (step: 0 | 1) => {
    facade.step.set(step);
    fixture.detectChanges();
  };

  it('shows the two steps of the request', () => {
    expect([...element().querySelectorAll('.create-step')].map(text)).toEqual(['1Produto', '2Revisão']);
  });

  it('offers search and optional category and unit filters, with no production date', () => {
    const page = element();
    expect(page.querySelector('#batch-product-search')).not.toBeNull();
    expect(text(page.querySelector('#batch-category option'))).toBe('Todas');
    expect(text(page.querySelector('#batch-unit option'))).toBe('Todas');
    expect(page.querySelector('input[type="date"]')).toBeNull();

    const category = page.querySelector<HTMLSelectElement>('#batch-category')!;
    category.value = 'AGRICULTURE';
    category.dispatchEvent(new Event('change'));
    expect(facade.setCategory).toHaveBeenCalledWith('AGRICULTURE');
    category.value = '';
    category.dispatchEvent(new Event('change'));
    expect(facade.setCategory).toHaveBeenLastCalledWith(null);
  });

  it('shows each product with its supplier, CO₂ and recent batches, recommending the first one with history', () => {
    facade.products.items.set([coffee, rice]);
    fixture.detectChanges();
    const [first, second] = [...element().querySelectorAll('.picker-option')].map((card) => [...card.children].map(text));
    expect(first).toEqual(['Café orgânico Recomendado', 'Fazenda Verde', '0,42 kg CO₂e/kg', '3 lotes nos últimos 30 dias']);
    expect(second).toEqual(['Arroz', 'Grãos da Serra', 'Sem histórico']);
  });

  it('explains when no product is found and offers to retry after an error', () => {
    facade.error.set('Não foi possível carregar os produtos. Tente novamente.');
    fixture.detectChanges();
    expect(element().textContent).toContain('Nenhum produto encontrado.');
    [...element().querySelectorAll('button')].find((button) => button.textContent?.includes('Tentar carregar novamente'))!.click();
    expect(facade.retryProducts).toHaveBeenCalled();
  });

  it('reviews the product and its supplier', () => {
    show(1);
    const review = text(element().querySelector('.review-list'));
    expect(review).toContain('Café orgânico');
    expect(review).toContain('Fazenda Verde');
    expect(review).toContain('Agricultura · Quilograma (kg)');
  });

  it('asks the quantity in the review and requests the batch', () => {
    show(1);
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
    show(1);
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
