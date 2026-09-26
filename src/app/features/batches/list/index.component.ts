import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { BatchesService } from '../index.service';
@Component({ selector: 'app-batches-list', imports: [RouterLink], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class BatchListComponent {
  private readonly service = inject(BatchesService); 
  readonly items = signal<Record<string, any>[]>([]); readonly loading = signal(true); readonly error = signal('');
  constructor() { this.reload(); }
  reload(): void { this.loading.set(true); this.service.loadBySupplier(Number(sessionStorage.getItem('supplierId'))).subscribe({ next: (data: any[]) => { this.items.set(data); this.loading.set(false); }, error: () => { this.error.set('Não foi possível carregar os dados. Tente novamente.'); this.loading.set(false); } }); }
}
