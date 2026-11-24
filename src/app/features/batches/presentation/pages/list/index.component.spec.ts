import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BatchesListFacade } from '../../../application/index.facade';
import { Batch } from '../../../domain/index.model';
import { BatchListComponent } from './index.component';

describe('BatchListComponent', () => {
  let fixture: ComponentFixture<BatchListComponent>;
  const batch = { batchId: 7, productId: 3, productName: 'Café', supplierId: 9, supplierName: 'Fazenda', marketId: 2, marketName: 'Mercado', status: 'ACTIVE', rejectionReason: null, quantity: 1, producedAt: '2026-05-20', currentStage: null, stages: [] } as Batch;

  function render(overrides: Record<string, unknown> = {}): HTMLElement {
    const facade = {
      items: signal([batch]),
      loading: signal(false),
      error: signal(''),
      totalElements: signal(1),
      totalPages: signal(1),
      pageNumber: signal(1),
      canCreate: signal(false),
      status: signal(null),
      setStatus: vi.fn(),
      canAddStageTo: () => true,
      canReject: () => false,
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

  it('filters by status through the badges', () => {
    const setStatus = vi.fn();
    const page = render({ setStatus, status: signal('ACTIVE') });
    const badges = [...page.querySelectorAll<HTMLButtonElement>('.batches-filter')];
    expect(badges.map((badge) => badge.textContent?.trim())).toEqual(['Todos', 'Pendente', 'Em andamento', 'Concluído', 'Recusado', 'Cancelado']);
    expect(badges.filter((badge) => badge.getAttribute('aria-pressed') === 'true').map((badge) => badge.textContent?.trim())).toEqual(['Em andamento']);
    badges[1].click();
    expect(setStatus).toHaveBeenCalledWith('PENDING');
    badges[0].click();
    expect(setStatus).toHaveBeenCalledWith('');
  });

  it('explains an empty filtered list', () => {
    const page = render({ items: signal([]), status: signal('REJECTED') });
    expect(page.textContent).toContain('Nenhum lote com esse status');
    expect(page.querySelector('.batches-empty')).toBeNull();
  });

  it('opens the reject modal from a card and reloads the list after rejecting', () => {
    const load = vi.fn();
    const page = render({ canReject: () => true, load });
    page.querySelector<HTMLButtonElement>('.batch-reject')!.click();
    fixture.detectChanges();
    expect(page.querySelector('app-batch-reject-modal')).not.toBeNull();

    fixture.componentInstance.batchRejected();
    fixture.detectChanges();
    expect(page.querySelector('app-batch-reject-modal')).toBeNull();
    expect(load).toHaveBeenCalled();
  });
});
