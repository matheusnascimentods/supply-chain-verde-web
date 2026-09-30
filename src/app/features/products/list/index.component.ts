import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductsService } from '../index.service';
import { ProductFormComponent } from '../form/index.component';
import { ProductCategory, ProductResponseDTO } from '../index.schema';

const PAGE_SIZE = 20;

@Component({ selector: 'app-products-list', imports: [FormsModule, ProductFormComponent], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class ProductListComponent {
  private readonly service = inject(ProductsService);
  private readonly searchChanges = new Subject<string>();
  private loadSequence = 0;

  readonly items = signal<ProductResponseDTO[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly offset = signal(0);
  readonly hasNext = signal(false);
  readonly createModalOpen = signal(false);
  readonly pageNumber = computed(() => Math.floor(this.offset() / PAGE_SIZE) + 1);

  constructor() {
    this.searchChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => this.load());
    this.reload();
  }

  reload(): void {
    this.load();
  }

  private load(): void {
    const sequence = ++this.loadSequence;
    this.loading.set(true);
    this.error.set('');
    this.service.load({ limit: PAGE_SIZE, offset: this.offset(), search: this.search() }).subscribe({
      next: (page) => {
        if (sequence !== this.loadSequence) return;
        this.items.set(page.items);
        this.hasNext.set(page.hasNext);
        this.loading.set(false);
      },
      error: () => {
        if (sequence !== this.loadSequence) return;
        this.error.set('Não foi possível carregar os produtos. Tente novamente.');
        this.loading.set(false);
      },
    });
  }

  searchFor(value: string): void {
    this.search.set(value);
    this.offset.set(0);
    this.searchChanges.next(value.trim());
  }

  previousPage(): void {
    if (this.offset() === 0) return;
    this.offset.update((offset) => Math.max(0, offset - PAGE_SIZE));
    this.load();
  }

  nextPage(): void {
    if (!this.hasNext()) return;
    this.offset.update((offset) => offset + PAGE_SIZE);
    this.load();
  }

  openCreateModal(): void { this.createModalOpen.set(true); }
  dismissCreateModal(): void { this.createModalOpen.set(false); }
  productCreated(): void { this.createModalOpen.set(false); this.load(); }

  imagePath(category: ProductCategory): string {
    const files: Record<ProductCategory, string> = {
      AGRICULTURE: 'agriculture.webp', LIVESTOCK: 'livestock.webp', PROCESSED_FOOD: 'processed-food.webp',
      TEXTILE: 'textile.webp', FORESTRY: 'forestry.webp', OTHER: 'other.webp',
    };
    return `/images/products/${files[category]}`;
  }

  imageFailed(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
  }

  categoryLabel(category: ProductCategory): string {
    const labels: Record<ProductCategory, string> = {
      AGRICULTURE: 'Agricultura',
      LIVESTOCK: 'Pecuária',
      PROCESSED_FOOD: 'Alimentos processados',
      TEXTILE: 'Têxtil',
      FORESTRY: 'Florestal',
      OTHER: 'Outro',
    };
    return labels[category];
  }

  categoryStyle(category: ProductCategory): string {
    const styles: Record<ProductCategory, string> = {
      AGRICULTURE: 'bg-green-100 text-green-800',
      LIVESTOCK: 'bg-amber-100 text-amber-800',
      PROCESSED_FOOD: 'bg-orange-100 text-orange-800',
      TEXTILE: 'bg-blue-100 text-blue-800',
      FORESTRY: 'bg-emerald-100 text-emerald-800',
      OTHER: 'bg-slate-200 text-slate-700',
    };
    return styles[category];
  }

  unitLabel(unit: ProductResponseDTO['unit']): string {
    const labels: Record<ProductResponseDTO['unit'], string> = {
      KG: 'kg',
      TON: 't',
      LITER: 'L',
      UNIT: 'un',
      M3: 'm³',
    };
    return labels[unit];
  }
}
