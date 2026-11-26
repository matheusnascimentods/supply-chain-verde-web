import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';
import { ErrorToastService } from '../../../../../shared/ui/error-toast/index.service';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { BatchesListFacade } from '../../../application/index.facade';
import { CancelBatchUseCase } from '../../../application/use-cases/cancel-batch/index.use-case';
import { BATCH_STATUSES, BATCH_STATUS_LABELS, Batch } from '../../../domain/index.model';
import { pendingEmissionStage } from '../../../domain/index.rules';
import { BatchCardComponent } from '../../components/batch-card/index.component';
import { BatchCreateModalComponent } from '../../components/create-modal/index.component';
import { BatchRejectModalComponent } from '../../components/reject-modal/index.component';
import { BatchStageModalComponent } from '../../components/stage-modal/index.component';

@Component({
  selector: 'app-batches-list',
  imports: [BatchCardComponent, BatchCreateModalComponent, BatchRejectModalComponent, BatchStageModalComponent, ButtonComponent, ModalComponent, PaginationComponent],
  providers: [BatchesListFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchListComponent {
  protected readonly facade = inject(BatchesListFacade);
  private readonly cancelUseCase = inject(CancelBatchUseCase);
  private readonly toast = inject(ErrorToastService);
  protected readonly statuses = BATCH_STATUSES;
  protected readonly statusLabels = BATCH_STATUS_LABELS;
  protected readonly pendingEmissionStage = pendingEmissionStage;
  readonly createModalOpen = signal(false);
  readonly stageBatch = signal<Batch | null>(null);
  readonly emissionBatch = signal<Batch | null>(null);
  readonly rejectBatch = signal<Batch | null>(null);
  readonly cancelBatch = signal<Batch | null>(null);
  readonly canceling = signal(false);

  batchCreated(): void {
    this.createModalOpen.set(false);
    this.facade.reloadFromFirstPage();
  }

  // O lote recusado continua na lista, agora com o motivo (RF-15).
  batchRejected(): void {
    this.rejectBatch.set(null);
    this.facade.load();
  }

  // ponytail: a confirmação fica aqui, sem um cancel-modal próprio, porque não há formulário. Vira componente se ganhar um motivo.
  confirmCancel(): void {
    const batch = this.cancelBatch();
    if (!batch || this.canceling()) return;
    this.canceling.set(true);
    this.cancelUseCase.execute(batch.batchId).subscribe({
      next: () => {
        this.canceling.set(false);
        this.cancelBatch.set(null);
        this.facade.load();
      },
      error: (error: unknown) => {
        this.canceling.set(false);
        this.cancelBatch.set(null);
        // 409: o fornecedor aceitou ou recusou antes; a lista recarrega com o status atual.
        this.toast.show(apiErrorMessage(error, 'Não foi possível cancelar o pedido. Tente novamente.'));
        this.facade.load();
      },
    });
  }

  emissionCalculated(): void {
    this.emissionBatch.set(null);
    this.facade.load();
  }

  stageCreated(): void {
    this.stageBatch.set(null);
    this.facade.load();
  }
}
