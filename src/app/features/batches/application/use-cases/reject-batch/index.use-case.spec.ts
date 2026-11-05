import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BatchesRepository } from '../../../infrastructure/index.repository';
import { RejectBatchUseCase } from './index.use-case';

describe('RejectBatchUseCase', () => {
  const reject = vi.fn();

  beforeEach(() => {
    reject.mockReset().mockReturnValue(of({ batchId: 7, status: 'REJECTED' }));
    TestBed.configureTestingModule({ providers: [{ provide: BatchesRepository, useValue: { reject } }] });
  });

  it('sends the trimmed reason', () => {
    TestBed.inject(RejectBatchUseCase).execute(7, '  Sem capacidade no período.  ').subscribe();
    expect(reject).toHaveBeenCalledWith(7, 'Sem capacidade no período.');
  });

  it('refuses a blank reason without calling the API', () => {
    let error: unknown;
    TestBed.inject(RejectBatchUseCase).execute(7, '   ').subscribe({ error: (value) => (error = value) });
    expect(reject).not.toHaveBeenCalled();
    expect((error as Error).message).toBe('O motivo da recusa é obrigatório.');
  });
});
