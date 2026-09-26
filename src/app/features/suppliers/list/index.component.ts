import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SuppliersService } from '../index.service';
import { SupplierRankingResponseDTO, SupplierResponseDTO } from '../index.schema';
import { AppSidebarComponent } from '../../../shared/components/app-sidebar/index.component';

@Component({ selector: 'app-suppliers-list', imports: [RouterLink, FormsModule, AppSidebarComponent], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class SupplierListComponent {
  private readonly service = inject(SuppliersService);

  readonly items = signal<SupplierResponseDTO[]>([]);
  readonly ranking = signal<SupplierRankingResponseDTO[]>([]);
  readonly expiringSupplierIds = signal<number[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly filteredItems = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    if (!query) return this.items();
    return this.items().filter((item) => `${item.name} ${item.cnpj ?? ''}`.toLocaleLowerCase().includes(query));
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      suppliers: this.service.load(),
      ranking: this.service.loadRanking(),
      expiringSupplierIds: this.service.loadExpiringCertificationSupplierIds(),
    }).subscribe({
      next: ({ suppliers, ranking, expiringSupplierIds }) => {
        this.items.set(suppliers);
        this.ranking.set(ranking);
        this.expiringSupplierIds.set(expiringSupplierIds);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar os fornecedores. Tente novamente.');
        this.loading.set(false);
      },
    });
  }

  certificationLabel(supplierId: number): string {
    const expiringCount = this.expiringSupplierIds().filter((id) => id === supplierId).length;
    if (expiringCount > 0) return `${expiringCount} expirando`;

    const supplierRanking = this.ranking().find((item) => item.supplierId === supplierId);
    const activeCount = supplierRanking?.activeCertificationCount
      ?? supplierRanking?.activeCertifications
      ?? supplierRanking?.activeCertificationsCount
      ?? 0;
    return activeCount > 0 ? `${activeCount} ativas` : 'Sem certificação';
  }

  score(supplierId: number): string {
    const score = this.ranking().find((item) => item.supplierId === supplierId)?.sustainabilityScore;
    return score === undefined ? '—' : String(Math.round(score));
  }
}
