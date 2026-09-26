import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../index.service';
import { ProductCategory, ProductResponseDTO } from '../index.schema';

@Component({ selector: 'app-products-list', imports: [RouterLink, FormsModule], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class ProductListComponent {
  private readonly service = inject(ProductsService);

  readonly items = signal<ProductResponseDTO[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly filteredItems = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    if (!query) return this.items();
    return this.items().filter((product) =>
      `${product.name} ${this.categoryLabel(product.category)} ${product.description ?? ''}`
        .toLocaleLowerCase()
        .includes(query),
    );
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.load().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar os produtos. Tente novamente.');
        this.loading.set(false);
      },
    });
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
    if (category === 'TEXTILE') return 'bg-blue-100 text-blue-700';
    if (category === 'OTHER') return 'bg-slate-200 text-slate-700';
    return 'bg-green-50 text-green-700';
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
