import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BatchCreationFacade } from '../../../application/create-batch/index.facade';
import { BatchCreateModalComponent } from './index.component';

describe('BatchCreateModalComponent', () => {
  let fixture: ComponentFixture<BatchCreateModalComponent>;
  let facade: ReturnType<typeof createFacade>;
  let created: number;

  function list() {
    return { items: signal([]), page: signal(0), totalPages: signal(0), search: signal(''), loading: signal(false), searchFor: vi.fn(), changePage: vi.fn() };
  }

  function createFacade() {
    return {
      isAdmin: true,
      isSupplier: false,
      step: signal<0 | 1 | 2>(0),
      saving: signal(false),
      error: signal(''),
      savedNotice: signal(''),
      products: list(),
      suppliers: list(),
      selectedProduct: signal(null),
      pendingProduct: signal(null),
      createdProduct: signal(null),
      selectedSupplier: signal(null),
      pendingSupplier: signal(null),
      createdSupplier: signal(null),
      ownSupplier: signal(null),
      loadingSuppliers: signal(false),
      hasProductChoice: signal(true),
      hasSupplierChoice: signal(true),
      hasPartialCreation: signal(false),
      productName: signal('Café'),
      supplierName: signal('Fazenda Verde'),
      canRetryChoices: signal(false),
      next: vi.fn().mockReturnValue(false),
      previous: vi.fn(),
      submit: vi.fn().mockReturnValue(of({ step: 'batch' })),
      useNewProduct: vi.fn(),
      useNewSupplier: vi.fn(),
      reportError: vi.fn(),
      retryChoices: vi.fn(),
      selectProduct: vi.fn(),
      selectSupplier: vi.fn(),
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

  it('marks the batch data as touched when it cannot advance from the first step', () => {
    fixture.componentInstance.next();
    expect(facade.next).toHaveBeenCalledWith(false);
    expect(fixture.componentInstance.batchForm.controls.quantity.touched).toBe(true);
  });

  it('sends the batch data and notifies the page only when the batch is created', () => {
    fixture.componentInstance.batchForm.setValue({ quantity: 250, producedAt: '2026-10-05' });
    facade.step.set(2);
    fixture.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalledWith({ quantity: 250, producedAt: '2026-10-05' });
    expect(created).toBe(1);

    facade.submit.mockReturnValue(throwError(() => new Error('falhou')));
    fixture.componentInstance.submit();
    expect(created).toBe(1);
  });

  it('goes back to the first step when the batch data became invalid', () => {
    facade.step.set(2);
    fixture.componentInstance.submit();
    expect(facade.submit).not.toHaveBeenCalled();
    expect(facade.step()).toBe(0);
  });

  it('does not close while a partial creation must be completed', () => {
    let dismissed = 0;
    fixture.componentInstance.dismiss.subscribe(() => dismissed++);
    facade.hasPartialCreation.set(true);
    fixture.componentInstance.requestDismiss();
    expect(dismissed).toBe(0);
    facade.hasPartialCreation.set(false);
    fixture.componentInstance.requestDismiss();
    expect(dismissed).toBe(1);
  });
});
