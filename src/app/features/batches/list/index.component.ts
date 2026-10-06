import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BatchResponseDTO } from '../index.schema';
import { BatchesService } from '../index.service';
import { SessionService } from '../../../core/auth/session/index.service';
import { ProductsService } from '../../products/index.service';
import { ProductUnit } from '../../products/index.schema';
import { ChainResponseDTO, StageType } from '../../traceability/index.schema';
import { BatchCreateModalComponent } from './create-modal/index.component';
import { BatchStageModalComponent } from './stage-modal/index.component';
import { PaginationComponent } from '../../../shared/components/pagination/index.component';

const PAGE_SIZE = 20;

type BatchStageTone = {
  dot: string;
  text: string;
  action: string;
  panel: string;
  arrow: string;
  line: string;
  node: string;
};

const BATCH_STAGE_TONES: Record<StageType | 'CREATED', BatchStageTone> = {
  CREATED: {
    dot: 'bg-slate-500',
    text: 'text-slate-700',
    action: 'text-slate-700 hover:text-slate-950 focus-visible:outline-slate-600',
    panel: 'bg-slate-50/75',
    arrow: 'text-slate-600',
    line: 'bg-slate-200',
    node: 'border-slate-400',
  },
  PRODUCTION: {
    dot: 'bg-sky-500',
    text: 'text-sky-800',
    action: 'text-sky-800 hover:text-sky-950 focus-visible:outline-sky-700',
    panel: 'bg-sky-50/50',
    arrow: 'text-sky-700',
    line: 'bg-sky-200',
    node: 'border-sky-500',
  },
  STORAGE: {
    dot: 'bg-indigo-500',
    text: 'text-indigo-800',
    action: 'text-indigo-800 hover:text-indigo-950 focus-visible:outline-indigo-700',
    panel: 'bg-indigo-50/50',
    arrow: 'text-indigo-700',
    line: 'bg-indigo-200',
    node: 'border-indigo-500',
  },
  PROCESSING: {
    dot: 'bg-amber-500',
    text: 'text-amber-800',
    action: 'text-amber-800 hover:text-amber-950 focus-visible:outline-amber-700',
    panel: 'bg-amber-50/50',
    arrow: 'text-amber-700',
    line: 'bg-amber-200',
    node: 'border-amber-500',
  },
  TRANSPORT: {
    dot: 'bg-orange-500',
    text: 'text-orange-800',
    action: 'text-orange-800 hover:text-orange-950 focus-visible:outline-orange-700',
    panel: 'bg-orange-50/50',
    arrow: 'text-orange-700',
    line: 'bg-orange-200',
    node: 'border-orange-500',
  },
  DISTRIBUTION: {
    dot: 'bg-violet-500',
    text: 'text-violet-800',
    action: 'text-violet-800 hover:text-violet-950 focus-visible:outline-violet-700',
    panel: 'bg-violet-50/50',
    arrow: 'text-violet-700',
    line: 'bg-violet-200',
    node: 'border-violet-500',
  },
  RETAIL: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-800',
    action: 'text-emerald-800 hover:text-emerald-950 focus-visible:outline-emerald-700',
    panel: 'bg-emerald-50/50',
    arrow: 'text-emerald-700',
    line: 'bg-emerald-200',
    node: 'border-emerald-600',
  },
};

@Component({
  selector: 'app-batches-list',
  imports: [BatchCreateModalComponent, BatchStageModalComponent, PaginationComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchListComponent {
  private readonly service = inject(BatchesService);
  private readonly session = inject(SessionService);
  private readonly productsService = inject(ProductsService);
  private loadSequence = 0;

  readonly items = signal<BatchResponseDTO[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly createModalOpen = signal(false);
  readonly stageBatch = signal<BatchResponseDTO | null>(null);
  readonly productUnits = signal(new Map<number, ProductUnit>());
  readonly pageNumber = computed(() => (this.totalPages() === 0 ? 0 : this.page() + 1));
  readonly canCreate = computed(() => ['admin', 'supplier'].includes(this.session.role() ?? ''));
  readonly canAddStage = computed(() =>
    ['admin', 'manager', 'supplier'].includes(this.session.role() ?? ''),
  );

  constructor() {
    this.load();
    this.productsService.loadAll().subscribe({
      next: (products) =>
        this.productUnits.set(
          new Map(products.map((product) => [product.productId, product.unit])),
        ),
      error: () => this.productUnits.set(new Map()),
    });
  }

  load(): void {
    const sequence = ++this.loadSequence;
    this.loading.set(true);
    this.error.set('');
    this.service.load({ page: this.page(), size: PAGE_SIZE }).subscribe({
      next: (result) => {
        if (sequence !== this.loadSequence) return;
        this.items.set(result.content);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: () => {
        if (sequence !== this.loadSequence) return;
        this.error.set('Não foi possível carregar os lotes. Tente novamente.');
        this.loading.set(false);
      },
    });
  }

  previousPage(): void {
    if (this.page() <= 0 || this.loading()) return;
    this.page.update((page) => Math.max(page - 1, 0));
    this.load();
  }

  nextPage(): void {
    if (this.page() + 1 >= this.totalPages() || this.loading()) return;
    this.page.update((page) => page + 1);
    this.load();
  }

  openCreateModal(): void {
    this.createModalOpen.set(true);
  }
  dismissCreateModal(): void {
    this.createModalOpen.set(false);
  }

  batchCreated(): void {
    this.createModalOpen.set(false);
    this.page.set(0);
    this.load();
  }

  openStageModal(batch: BatchResponseDTO): void {
    this.stageBatch.set(batch);
  }
  dismissStageModal(): void {
    this.stageBatch.set(null);
  }
  stageCreated(): void {
    this.stageBatch.set(null);
    this.load();
  }

  statusLabel(batch: BatchResponseDTO): string {
    if (!batch.currentStage) return 'Criado';
    return batch.currentStage === 'RETAIL' ? 'Concluído' : 'Em andamento';
  }

  statusStyle(batch: BatchResponseDTO): string {
    if (!batch.currentStage) return 'bg-blue-50 text-blue-800 ring-blue-200';
    return batch.currentStage === 'RETAIL'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      : 'bg-green-50 text-green-800 ring-green-200';
  }

  stageTone(batch: BatchResponseDTO): BatchStageTone {
    return BATCH_STAGE_TONES[batch.currentStage ?? 'CREATED'];
  }

  stageLabel(type: StageType): string {
    const labels: Record<StageType, string> = {
      PRODUCTION: 'Produção',
      STORAGE: 'Armazenagem',
      PROCESSING: 'Processamento',
      TRANSPORT: 'Transporte',
      DISTRIBUTION: 'Distribuição',
      RETAIL: 'Varejo',
    };
    return labels[type];
  }

  quantity(batch: BatchResponseDTO): string {
    const unit = batch.productId === null ? undefined : this.productUnits().get(batch.productId);
    const units: Record<ProductUnit, string> = {
      KG: 'kg',
      TON: 't',
      LITER: 'L',
      UNIT: 'un',
      M3: 'm³',
    };
    const amount = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(
      batch.quantity,
    );
    return `${amount}${unit ? ` ${units[unit]}` : ''}`;
  }

  formatDate(value: string, includeTime = false): string {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(
          Number(value.slice(0, 4)),
          Number(value.slice(5, 7)) - 1,
          Number(value.slice(8, 10)),
        )
      : new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(
      'pt-BR',
      includeTime
        ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: 'short', year: 'numeric' },
    ).format(date);
  }

  routeOrigin(batch: BatchResponseDTO): string {
    const first = batch.stages[0];
    return first
      ? this.addressLabel(first.originAddress, batch.supplierName ?? 'Fornecedor não identificado')
      : (batch.supplierName ?? 'Fornecedor não identificado');
  }

  routeDestination(batch: BatchResponseDTO): string {
    const last = batch.stages.at(-1);
    if (!last) return 'Etapas ainda não registradas';
    return this.addressLabel(last.destinationAddress, this.stageLabel(last.stageType));
  }

  stageAddress(stage: ChainResponseDTO): string {
    const origin = this.addressLabel(stage.originAddress, 'Local não informado');
    const destination = stage.destinationAddress
      ? this.addressLabel(stage.destinationAddress, '')
      : '';
    return destination && destination !== origin ? `${origin} → ${destination}` : origin;
  }

  transportModeLabel(mode: NonNullable<ChainResponseDTO['transport']>['transportMode']): string {
    const labels = { ROAD: 'Rodoviário', RAIL: 'Ferroviário', MARITIME: 'Marítimo', AIR: 'Aéreo' };
    return labels[mode];
  }

  private addressLabel(address: ChainResponseDTO['originAddress'], fallback: string): string {
    if (!address) return fallback;
    const location = [address.city, address.state].filter(Boolean).join(', ');
    return location || fallback;
  }
}
