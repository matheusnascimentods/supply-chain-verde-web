import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BatchesListFacade } from '../../../application/index.facade';
import { Batch } from '../../../domain/index.model';
import { BatchListComponent } from './index.component';

describe('BatchListComponent', () => {
  let fixture: ComponentFixture<BatchListComponent>;
  const batch = { batchId: 7, productId: 3, productName: 'Café', supplierId: 9, supplierName: 'Fazenda', quantity: 1, producedAt: '2026-05-20', currentStage: null, stages: [] } as Batch;

  function render(overrides: Record<string, unknown> = {}): HTMLElement {
    const facade = {
      items: signal([batch]),
      loading: signal(false),
      error: signal(''),
      totalElements: signal(1),
      totalPages: signal(1),
      pageNumber: signal(1),
      canCreate: signal(false),
      canAddStageTo: () => true,
      unitOf: () => 'KG',
      load: vi.fn(),
      previousPage: vi.fn(),
      nextPage: vi.fn(),
      reloadFromFirstPage: vi.fn(),
      ...overrides,
    };
    TestBed.overrideComponent(BatchListComponent, { set: { providers: [{ provide: BatchesListFacade, useValue: facade }] } });
    fixture = TestBed.createComponent(BatchListComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('renders one card per batch and the total count', () => {
    const page = render();
    expect(page.querySelectorAll('app-batch-card').length).toBe(1);
    expect(page.textContent).toContain('1 lote cadastrado');
    expect(page.textContent).not.toContain('Novo lote');
  });

  it('shows the empty state with the create action when allowed', () => {
    const page = render({ items: signal([]), canCreate: signal(true) });
    expect(page.textContent).toContain('Nenhum lote por aqui ainda');
    expect(page.textContent).toContain('Cadastrar primeiro lote');
  });

  it('shows the error with a retry action', () => {
    const load = vi.fn();
    const page = render({ error: signal('Não foi possível carregar os lotes. Tente novamente.'), load });
    page.querySelector<HTMLButtonElement>('.batches-retry')!.click();
    expect(load).toHaveBeenCalled();
  });
});
