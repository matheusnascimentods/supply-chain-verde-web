import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EnumSelectComponent } from '../../../../../shared/ui/enum-select/index.component';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { BatchesListFacade } from '../../../application/index.facade';
import { BATCH_STATUSES, BATCH_STATUS_LABELS, Batch } from '../../../domain/index.model';
import { BatchCardComponent } from '../../components/batch-card/index.component';
import { BatchCreateModalComponent } from '../../components/create-modal/index.component';
import { BatchRejectModalComponent } from '../../components/reject-modal/index.component';
import { BatchStageModalComponent } from '../../components/stage-modal/index.component';

@Component({
  selector: 'app-batches-list',
  imports: [BatchCardComponent, BatchCreateModalComponent, BatchRejectModalComponent, BatchStageModalComponent, EnumSelectComponent, PaginationComponent],
  providers: [BatchesListFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchListComponent {
  protected readonly facade = inject(BatchesListFacade);
  protected readonly statuses = BATCH_STATUSES;
  protected readonly statusLabels = BATCH_STATUS_LABELS;
  readonly createModalOpen = signal(false);
  readonly stageBatch = signal<Batch | null>(null);
  readonly rejectBatch = signal<Batch | null>(null);

  batchCreated(): void {
    this.createModalOpen.set(false);
    this.facade.reloadFromFirstPage();
  }

  // O lote recusado continua na lista, agora com o motivo (RF-15).
  batchRejected(): void {
    this.rejectBatch.set(null);
    this.facade.load();
  }

  stageCreated(): void {
    this.stageBatch.set(null);
    this.facade.load();
  }
}
