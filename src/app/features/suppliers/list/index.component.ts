import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SuppliersService } from '../index.service';
@Component({ selector: 'app-suppliers-list', imports: [RouterLink, FormsModule], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class SupplierListComponent {
  private readonly service = inject(SuppliersService); 
  readonly items = signal<Record<string, any>[]>([]); readonly loading = signal(true); readonly error = signal(''); readonly search = signal('');
  constructor() { this.reload(); }
  reload(): void { this.loading.set(true); this.service.load(this.search()).subscribe({ next: (data: any[]) => { this.items.set(data); this.loading.set(false); }, error: () => { this.error.set('Não foi possível carregar os dados. Tente novamente.'); this.loading.set(false); } }); }
}
