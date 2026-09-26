import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductsService } from '../index.service';
@Component({ selector: 'app-products-list', imports: [RouterLink], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class ProductListComponent {
  private readonly service = inject(ProductsService); 
  readonly items = signal<Record<string, any>[]>([]); readonly loading = signal(true); readonly error = signal('');
  constructor() { this.reload(); }
  reload(): void { this.loading.set(true); this.service.load().subscribe({ next: (data: any[]) => { this.items.set(data); this.loading.set(false); }, error: () => { this.error.set('Não foi possível carregar os dados. Tente novamente.'); this.loading.set(false); } }); }
}
