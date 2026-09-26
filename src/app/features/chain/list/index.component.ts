import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ChainService } from '../index.service';
@Component({ selector: 'app-chain-list', imports: [RouterLink], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class ChainListComponent {
  private readonly service = inject(ChainService); private readonly route = inject(ActivatedRoute);
  readonly items = signal<Record<string, any>[]>([]); readonly loading = signal(true); readonly error = signal('');
  constructor() { this.reload(); }
  reload(): void { this.loading.set(true); this.service.load(Number(this.route.snapshot.paramMap.get('batchId'))).subscribe({ next: (data: any[]) => { this.items.set([...data].sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)))); this.loading.set(false); }, error: () => { this.error.set('Não foi possível carregar os dados. Tente novamente.'); this.loading.set(false); } }); }
}
