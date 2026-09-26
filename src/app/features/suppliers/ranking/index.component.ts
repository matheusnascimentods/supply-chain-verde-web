import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SuppliersService } from '../index.service';
import { SupplierRankingResponseDTO, SupplierResponseDTO } from '../index.schema';

@Component({ selector: 'app-supplier-ranking', templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class SupplierRankingComponent {
  private readonly service = inject(SuppliersService);
  readonly items = signal<SupplierRankingResponseDTO[]>([]); readonly sort = signal('sustainabilityScore'); readonly error = signal('');
  readonly suppliers = signal<SupplierResponseDTO[]>([]);
  readonly loading = signal(true);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ items: this.service.loadRanking(this.sort()), suppliers: this.service.load() }).subscribe({
      next: ({ items, suppliers }) => {
        this.items.set(items);
        this.suppliers.set(suppliers);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar o ranking.');
        this.loading.set(false);
      },
    });
  }

  setSort(value: string): void { this.sort.set(value); this.load(); }
  name(item: SupplierRankingResponseDTO): string { return item.supplierName ?? item.name ?? `Fornecedor ${item.supplierId}`; }
  certifications(item: SupplierRankingResponseDTO): number { return item.activeCertificationCount ?? item.activeCertifications ?? item.activeCertificationsCount ?? 0; }
  location(supplierId: number): string {
    const address = this.suppliers().find((supplier) => supplier.supplierId === supplierId)?.address;
    return [address?.city, address?.state].filter(Boolean).join('/') || 'Localização não informada';
  }
  scorePercent(score: number): number { return Math.max(0, Math.min(100, score)); }
  score(score: number): string { return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(score); }
  co2(value: number | undefined): string { return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value ?? 0); }
}
