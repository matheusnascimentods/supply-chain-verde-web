import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { SessionService } from '../../../core/session/index.service';
import { CertificationFormComponent } from '../form/index.component';
import { CertificationStatus, CertificationResponseDTO } from '../index.schema';
import { CertificationsService } from '../index.service';

type CertificationFilter = 'all' | 'expiring' | 'active' | 'suspended' | 'underReview';

@Component({
  selector: 'app-certifications-list',
  imports: [CertificationFormComponent],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeFilterOnOutsideClick($event)',
  },
})
export class CertificationListComponent {
  private readonly service = inject(CertificationsService);
  private readonly session = inject(SessionService);
  private loadSequence = 0;

  @ViewChild('certificationFilterMenu') private filterMenu?: ElementRef<HTMLDetailsElement>;
  @ViewChildren('certificationStatusMenu') private statusMenus?: QueryList<
    ElementRef<HTMLDetailsElement>
  >;

  readonly items = signal<CertificationResponseDTO[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly statusError = signal('');
  readonly filter = signal<CertificationFilter>('all');
  readonly expiring = computed(() => this.filter() === 'expiring');
  readonly filterLabel = computed(() =>
    this.filterOptions.find((option) => option.value === this.filter())?.label ?? 'Todas as certificações',
  );
  readonly filterOptions: { value: CertificationFilter; label: string; status: CertificationStatus | null }[] = [
    { value: 'all', label: 'Todas as certificações', status: null },
    { value: 'expiring', label: 'Apenas expirando', status: 'expired' },
    { value: 'active', label: 'Ativas', status: 'active' },
    { value: 'suspended', label: 'Suspensas', status: 'suspended' },
    { value: 'underReview', label: 'Em análise', status: 'underReview' },
  ];
  readonly statusOptions: CertificationStatus[] = [
    'active',
    'expired',
    'suspended',
    'underReview',
  ];
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly updatingStatusId = signal<number | null>(null);
  readonly createModalOpen = signal(false);
  readonly canCreate = computed(() => this.session.role() === 'supplier');
  readonly canUpdateStatus = computed(() =>
    ['admin', 'auditor'].includes(this.session.role() ?? ''),
  );

  constructor() {
    this.reload();
  }

  reload(): void {
    const sequence = ++this.loadSequence;
    this.loading.set(true);
    this.error.set('');
    const selectedFilter = this.filterOptions.find((option) => option.value === this.filter());
    this.service.load(selectedFilter?.status ?? null, this.page()).subscribe({
      next: (response) => {
        if (sequence !== this.loadSequence) return;
        this.items.set(response.items);
        this.page.set(response.page);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: () => {
        if (sequence !== this.loadSequence) return;
        this.error.set('Não foi possível carregar as certificações. Tente novamente.');
        this.loading.set(false);
      },
    });
  }

  setFilter(value: CertificationFilter): void {
    this.filter.set(value);
    this.page.set(0);
    if (this.filterMenu) {
      this.filterMenu.nativeElement.open = false;
      this.filterMenu.nativeElement.querySelector('summary')?.focus();
    }
    this.reload();
  }

  closeFilterOnOutsideClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (!this.filterMenu?.nativeElement.contains(target)) {
      this.filterMenu?.nativeElement.removeAttribute('open');
    }
    this.statusMenus?.forEach(({ nativeElement: menu }) => {
      if (!menu.contains(target)) menu.open = false;
    });
  }

  handleMenuKeydown(event: KeyboardEvent, menu: HTMLDetailsElement): void {
    if (!menu.open) return;
    const options = Array.from(
      menu.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'),
    );
    if (event.key === 'Escape') {
      event.preventDefault();
      menu.open = false;
      menu.querySelector('summary')?.focus();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const currentIndex = options.indexOf(event.target as HTMLButtonElement);
      const nextIndex =
        currentIndex < 0
          ? event.key === 'ArrowUp'
            ? options.length - 1
            : 0
          : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? options.length - 1
            : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) %
              options.length;
      options[nextIndex]?.focus();
    }
  }

  closeStatusMenu(menu: HTMLDetailsElement): void {
    menu.open = false;
    menu.querySelector('summary')?.focus();
  }

  filterIcon(value: CertificationFilter): string {
    const icons: Record<CertificationFilter, string> = {
      all: 'M4 6h16M4 12h16M4 18h16',
      expiring: 'M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      active: 'm5 12 4 4L19 6',
      suspended: 'M8 8v8m8-8v8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
      underReview: 'M12 8v4m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    };
    return icons[value];
  }

  statusIcon(status: CertificationStatus): string {
    return this.filterIcon(status === 'expired' ? 'expiring' : status);
  }

  previousPage(): void {
    if (this.page() === 0 || this.loading()) return;
    this.page.update((page) => page - 1);
    this.reload();
  }

  nextPage(): void {
    if (this.page() + 1 >= this.totalPages() || this.loading()) return;
    this.page.update((page) => page + 1);
    this.reload();
  }

  setStatus(item: CertificationResponseDTO, status: CertificationStatus): void {
    if (!this.canUpdateStatus() || item.status === status) return;

    this.statusError.set('');
    this.updatingStatusId.set(item.certificationId);
    this.service.updateStatus(item.certificationId, status).subscribe({
      next: () => {
        this.updatingStatusId.set(null);
        this.reload();
      },
      error: () => {
        this.updatingStatusId.set(null);
        this.statusError.set(`Não foi possível atualizar o status de ${item.name}.`);
      },
    });
  }

  openCreateModal(): void {
    this.createModalOpen.set(true);
  }

  dismissCreateModal(): void {
    this.createModalOpen.set(false);
  }

  certificationCreated(): void {
    this.createModalOpen.set(false);
    this.reload();
  }

  date(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
  }

  statusLabel(status: CertificationStatus): string {
    const labels: Record<CertificationStatus, string> = {
      active: 'Ativa',
      expired: 'Expirada',
      suspended: 'Suspensa',
      underReview: 'Em análise',
    };
    return labels[status];
  }

  statusStyle(status: CertificationStatus): string {
    const styles: Record<CertificationStatus, string> = {
      active: 'bg-green-50 text-green-700 ring-green-600/20',
      expired: 'bg-red-50 text-red-700 ring-red-600/20',
      suspended: 'bg-slate-100 text-slate-700 ring-slate-600/20',
      underReview: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    };
    return styles[status];
  }
}
