import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ErrorToastService } from '../../../../../shared/ui/error-toast/index.service';
import { BatchesListFacade } from '../../../application/index.facade';
import { CancelBatchUseCase } from '../../../application/use-cases/cancel-batch/index.use-case';
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
      canCalculatePendingEmission: () => false,
      canReject: () => false,
      canCancel: () => false,
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

  it('opens the emission modal for the pending stage and reloads the list after calculating', () => {
    const stage = { chainId: 50, stageType: 'STORAGE', transport: null, emission: null };
    const pending = { ...batch, currentStage: 'STORAGE', stages: [stage] } as unknown as Batch;
    const load = vi.fn();
    const page = render({ items: signal([pending]), canAddStageTo: () => false, canCalculatePendingEmission: () => true, load });
    page.querySelector<HTMLButtonElement>('[data-testid="batch-calculate-emission"]')!.click();
    expect(fixture.componentInstance.emissionBatch()).toBe(pending);

    fixture.componentInstance.emissionCalculated();
    expect(fixture.componentInstance.emissionBatch()).toBeNull();
    expect(load).toHaveBeenCalled();
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

  describe('cancel', () => {
    const execute = vi.fn();
    const show = vi.fn();

    beforeEach(() => {
      execute.mockReset();
      show.mockReset();
      TestBed.configureTestingModule({
        providers: [
          { provide: CancelBatchUseCase, useValue: { execute } },
          { provide: ErrorToastService, useValue: { show } },
        ],
      });
    });

    function openConfirmation(load: ReturnType<typeof vi.fn>): HTMLElement {
      const page = render({ canCancel: () => true, load });
      page.querySelector<HTMLButtonElement>('[data-testid="batch-cancel"]')!.click();
      fixture.detectChanges();
      return page;
    }

    it('cancels the batch after the confirmation and reloads the list', () => {
      execute.mockReturnValue(of({ ...batch, status: 'CANCELED' }));
      const load = vi.fn();
      const page = openConfirmation(load);
      expect(page.textContent).toContain('Cancelar o pedido do lote #7?');

      page.querySelector<HTMLButtonElement>('[data-testid="confirm-cancel"]')!.click();
      fixture.detectChanges();
      expect(execute).toHaveBeenCalledWith(7);
      expect(load).toHaveBeenCalled();
      expect(page.querySelector('[data-testid="confirm-cancel"]')).toBeNull();
    });

    it('shows the API message in a toast when the batch left PENDING', () => {
      execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'O lote não está mais pendente.' } })));
      const load = vi.fn();
      const page = openConfirmation(load);
      page.querySelector<HTMLButtonElement>('[data-testid="confirm-cancel"]')!.click();
      fixture.detectChanges();
      expect(show).toHaveBeenCalledWith('O lote não está mais pendente.');
      expect(load).toHaveBeenCalled();
    });
  });
});
