import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';
import { DataTableComponent } from '../../../../../shared/ui/data-table/index.component';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { PRODUCT_CATEGORY_LABELS, PRODUCT_UNIT_LABELS, Product } from '../../../domain/index.model';
import { ProductsRepository } from '../../../infrastructure/index.repository';
import { ProductCreateModalComponent } from '../../components/create-modal/index.component';

const PAGE_SIZE = 20;

/** RF-16: o fornecedor lista e cadastra os próprios produtos (a API devolve só os da companhia dele). */
@Component({
  selector: 'app-product-list',
  imports: [FormsModule, ButtonComponent, DataTableComponent, PaginationComponent, TextFieldComponent, ProductCreateModalComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent {
  private readonly repository = inject(ProductsRepository);
  private readonly searchChanges = new Subject<string>();
  private loadSequence = 0;

  protected readonly categoryLabels = PRODUCT_CATEGORY_LABELS;
  protected readonly unitLabels = PRODUCT_UNIT_LABELS;
  readonly items = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly createModalOpen = signal(false);

  constructor() {
    this.searchChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => {
      this.page.set(0);
      this.load();
    });
    this.load();
  }

  load(): void {
    const sequence = ++this.loadSequence;
    this.loading.set(true);
    this.error.set('');
    this.repository.load({ limit: PAGE_SIZE, offset: this.page() * PAGE_SIZE, search: this.search() }).subscribe({
      next: (page) => {
        if (sequence !== this.loadSequence) return;
        this.items.set(page.items);
        this.totalPages.set(page.totalPages);
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
    this.searchChanges.next(value.trim());
  }

  changePage(delta: number): void {
    const next = this.page() + delta;
    if (next < 0 || next >= this.totalPages() || this.loading()) return;
    this.page.set(next);
    this.load();
  }

  productCreated(): void {
    this.createModalOpen.set(false);
    this.page.set(0);
    this.load();
  }
}
