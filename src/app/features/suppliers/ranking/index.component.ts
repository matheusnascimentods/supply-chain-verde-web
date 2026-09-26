import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SuppliersService } from '../index.service';
import { SupplierRankingResponseDTO } from '../index.schema';
@Component({ selector: 'app-supplier-ranking', imports: [RouterLink], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class SupplierRankingComponent {
  private readonly service = inject(SuppliersService);
  readonly items = signal<SupplierRankingResponseDTO[]>([]); readonly sort = signal('sustainabilityScore'); readonly error = signal('');
  constructor() { this.load(); }
  load(): void { this.service.loadRanking(this.sort()).subscribe({ next: (items) => this.items.set(items), error: () => this.error.set('Não foi possível carregar o ranking.') }); }
  setSort(value: string): void { this.sort.set(value); this.load(); }
  name(item: SupplierRankingResponseDTO): string { return item.supplierName ?? item.name ?? `Fornecedor ${item.supplierId}`; }
  certifications(item: SupplierRankingResponseDTO): number { return item.activeCertifications ?? item.activeCertificationsCount ?? 0; }
}
