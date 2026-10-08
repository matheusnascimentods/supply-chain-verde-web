import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { BatchesListFacade } from '../../../application/index.facade';
import { Batch } from '../../../domain/index.model';
import { BatchCardComponent } from '../../components/batch-card/index.component';
import { BatchCreateModalComponent } from '../../components/create-modal/index.component';
import { BatchStageModalComponent } from '../../components/stage-modal/index.component';

@Component({
  selector: 'app-batches-list',
  imports: [BatchCardComponent, BatchCreateModalComponent, BatchStageModalComponent, PaginationComponent],
  providers: [BatchesListFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchListComponent {
  protected readonly facade = inject(BatchesListFacade);
  readonly createModalOpen = signal(false);
  readonly stageBatch = signal<Batch | null>(null);

  batchCreated(): void {
    this.createModalOpen.set(false);
    this.facade.reloadFromFirstPage();
  }

  stageCreated(): void {
    this.stageBatch.set(null);
    this.facade.load();
  }
}
