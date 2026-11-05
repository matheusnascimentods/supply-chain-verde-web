import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { Certification } from '../../../domain/index.model';
import { CertificationsRepository } from '../../../infrastructure/index.repository';
import { CertificationFormComponent } from '../../components/form/index.component';
import { CertificationListComponent } from '../../components/list/index.component';

const PAGE_SIZE = 20;

/** RF-17: o fornecedor lista, cadastra e muda o status das próprias certificações. */
@Component({
  selector: 'app-certifications-page',
  imports: [CertificationFormComponent, CertificationListComponent, PaginationComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificationsPageComponent {
  private readonly repository = inject(CertificationsRepository);
  private loadSequence = 0;

  // O fornecedor da sessão (claim `supplierId`, igual ao `companyId` da companhia fornecedora).
  protected readonly supplierId = inject(SessionService).supplierId();
  readonly items = signal<Certification[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly page = signal(0);
  readonly totalPages = signal(0);

  constructor() {
    this.load();
  }

  load(): void {
    const sequence = ++this.loadSequence;
    this.loading.set(true);
    this.error.set('');
    this.repository.load({ page: this.page(), size: PAGE_SIZE }).subscribe({
      next: (page) => {
        if (sequence !== this.loadSequence) return;
        this.items.set(page.items);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => {
        if (sequence !== this.loadSequence) return;
        this.error.set('Não foi possível carregar as certificações. Tente novamente.');
        this.loading.set(false);
      },
    });
  }

  changePage(delta: number): void {
    const next = this.page() + delta;
    if (next < 0 || next >= this.totalPages() || this.loading()) return;
    this.page.set(next);
    this.load();
  }

  // Depois de cadastrar, a mais recente aparece no topo da primeira página.
  certificationCreated(): void {
    this.page.set(0);
    this.load();
  }
}
