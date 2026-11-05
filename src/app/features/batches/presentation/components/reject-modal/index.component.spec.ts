import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RejectBatchUseCase } from '../../../application/use-cases/reject-batch/index.use-case';
import { Batch } from '../../../domain/index.model';
import { BatchRejectModalComponent } from './index.component';

describe('BatchRejectModalComponent', () => {
  let fixture: ComponentFixture<BatchRejectModalComponent>;
  let execute: ReturnType<typeof vi.fn>;
  let rejected: number;
  const batch = { batchId: 7, productName: 'Café orgânico', marketName: 'Mercado Bom Preço', status: 'PENDING' } as Batch;

  function render(): HTMLElement {
    rejected = 0;
    execute = vi.fn().mockReturnValue(of({ ...batch, status: 'REJECTED' }));
    TestBed.configureTestingModule({ providers: [{ provide: RejectBatchUseCase, useValue: { execute } }] });
    fixture = TestBed.createComponent(BatchRejectModalComponent);
    fixture.componentRef.setInput('batch', batch);
    fixture.componentInstance.rejected.subscribe(() => rejected++);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const type = (value: string) => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#reject-reason')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  it('tells who requested the batch and that the refusal is final', () => {
    const modal = render();
    expect(modal.textContent).toContain('Lote #7');
    expect(modal.textContent).toContain('pedido por Mercado Bom Preço');
    expect(modal.textContent).toContain('A recusa é definitiva');
  });

  it('requires a reason, ignoring blank spaces', () => {
    const modal = render();
    type('   ');
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(execute).not.toHaveBeenCalled();
    expect(modal.querySelector('#reject-reason-error')?.textContent).toContain('Informe o motivo da recusa.');
  });

  it('rejects the batch with the reason and notifies the page', () => {
    render();
    type('Sem capacidade de produção.');
    fixture.componentInstance.submit();
    expect(execute).toHaveBeenCalledWith(7, 'Sem capacidade de produção.');
    expect(rejected).toBe(1);
  });

  it('shows the API message when the batch is no longer pending', () => {
    render();
    execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'Lote não está pendente.' } })));
    type('Sem capacidade.');
    fixture.componentInstance.submit();
    expect(rejected).toBe(0);
    expect(fixture.componentInstance.error()).toBe('Lote não está pendente.');
    expect(fixture.componentInstance.saving()).toBe(false);
  });
});
