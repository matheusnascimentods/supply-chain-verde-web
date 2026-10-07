import { ChangeDetectionStrategy, Component, ElementRef, QueryList, ViewChildren, computed, inject, input, output, signal } from '@angular/core';
import { SupplierCertificationDTO } from '../../index.schema';
import { CertificationsService } from '../../../certifications/index.service';
import { CertificationStatus } from '../../../certifications/index.schema';
import { CertificationFormComponent } from '../../../certifications/form/index.component';
import { ModalComponent } from '../../../../shared/ui/modal/index.component';

@Component({
  selector: 'app-supplier-certifications-modal',
  imports: [CertificationFormComponent, ModalComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'closeStatusMenusOnOutsideClick($event)' },
})
export class SupplierCertificationsModalComponent {
  private readonly service = inject(CertificationsService);
  @ViewChildren('certificationStatusMenu') private statusMenus?: QueryList<ElementRef<HTMLDetailsElement>>;
  readonly supplierId = input.required<number>();
  readonly supplierName = input.required<string>();
  readonly certifications = input.required<SupplierCertificationDTO[]>();
  readonly canCreate = input(false);
  readonly canUpdateStatus = input(false);
  readonly updated = output<void>();
  readonly dismissed = output<void>();
  readonly updatingStatusId = signal<number | null>(null);
  readonly statusMenuPosition = signal({ top: 0, left: 0 });
  readonly error = signal('');
  readonly items = computed(() => this.certifications());
  readonly statuses: { value: CertificationStatus; label: string }[] = [
    { value: 'active', label: 'Ativa' },
    { value: 'expired', label: 'Expirada' },
    { value: 'suspended', label: 'Suspensa' },
    { value: 'underReview', label: 'Em análise' },
  ];

  close(): void { this.dismissed.emit(); }

  date(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
  }

  status(value: SupplierCertificationDTO['status']): CertificationStatus {
    return value === 'UNDER_REVIEW' ? 'underReview' : value.toLowerCase() as CertificationStatus;
  }

  statusLabel(value: SupplierCertificationDTO['status']): string {
    return this.statuses.find((status) => status.value === this.status(value))?.label ?? value;
  }

  statusStyle(value: SupplierCertificationDTO['status']): string {
    return ({ ACTIVE: 'bg-green-50 text-green-700 ring-green-600/20', EXPIRED: 'bg-red-50 text-red-700 ring-red-600/20', SUSPENDED: 'bg-slate-100 text-slate-700 ring-slate-600/20', UNDER_REVIEW: 'bg-blue-50 text-blue-700 ring-blue-600/20' })[value];
  }

  setStatus(item: SupplierCertificationDTO, status: CertificationStatus, menu: HTMLDetailsElement): void {
    menu.open = false;
    menu.querySelector('summary')?.focus();
    if (!this.canUpdateStatus() || status === this.status(item.status)) return;
    this.error.set('');
    this.updatingStatusId.set(item.certificationId);
    this.service.updateStatus(item.certificationId, status).subscribe({
      next: () => { this.updatingStatusId.set(null); this.updated.emit(); },
      error: () => { this.updatingStatusId.set(null); this.error.set(`Não foi possível atualizar o status de ${item.certification}.`); },
    });
  }

  positionStatusMenu(event: Event): void {
    const menu = event.currentTarget as HTMLDetailsElement;
    if (!menu.open) return;
    const summary = menu.querySelector('summary');
    if (!summary) return;
    const bounds = summary.getBoundingClientRect();
    const menuHeight = 176;
    const menuWidth = 176;
    const placeBelow = window.innerHeight - bounds.bottom >= menuHeight + 12;
    const top = placeBelow ? bounds.bottom + 8 : Math.max(8, bounds.top - menuHeight - 8);
    const left = Math.max(8, Math.min(bounds.right - menuWidth, window.innerWidth - menuWidth - 8));
    this.statusMenuPosition.set({ top, left });
  }

  closeStatusMenusOnOutsideClick(event: MouseEvent): void {
    const target = event.target as Node;
    this.statusMenus?.forEach(({ nativeElement: menu }) => {
      if (!menu.contains(target)) menu.open = false;
    });
  }

  handleStatusMenuKeydown(event: KeyboardEvent, menu: HTMLDetailsElement): void {
    if (!menu.open) return;
    const options = Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
    if (event.key === 'Escape') {
      event.preventDefault();
      menu.open = false;
      menu.querySelector('summary')?.focus();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const currentIndex = options.indexOf(event.target as HTMLButtonElement);
      const nextIndex = currentIndex < 0
        ? event.key === 'ArrowUp' ? options.length - 1 : 0
        : event.key === 'Home' ? 0
          : event.key === 'End' ? options.length - 1
            : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[nextIndex]?.focus();
    }
  }

}
