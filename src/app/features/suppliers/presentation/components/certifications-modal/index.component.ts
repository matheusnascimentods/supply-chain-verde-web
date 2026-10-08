import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { CloseOnOutsideClickDirective } from '../../../../../shared/directives/close-on-outside-click/index.directive';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { formatIsoDateBr } from '../../../../../shared/utils/format/index.utils';
import {
  CERTIFICATION_STATUSES,
  CERTIFICATION_STATUS_LABELS,
  CertificationFormComponent,
  CertificationStatus,
  UpdateCertificationStatusUseCase,
} from '../../../../certifications';
import { SupplierCertification } from '../../../domain/index.model';

const MENU_HEIGHT = 176;
const MENU_WIDTH = 176;

@Component({
  selector: 'app-supplier-certifications-modal',
  imports: [CertificationFormComponent, ModalComponent, CloseOnOutsideClickDirective],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierCertificationsModalComponent {
  private readonly updateCertificationStatus = inject(UpdateCertificationStatusUseCase);
  protected readonly date = formatIsoDateBr;
  protected readonly statuses = CERTIFICATION_STATUSES;
  protected readonly statusLabels = CERTIFICATION_STATUS_LABELS;

  readonly supplierId = input.required<number>();
  readonly supplierName = input.required<string>();
  readonly certifications = input.required<SupplierCertification[]>();
  readonly canCreate = input(false);
  readonly canUpdateStatus = input(false);
  readonly updated = output<void>();
  readonly dismissed = output<void>();
  readonly updatingStatusId = signal<number | null>(null);
  readonly statusMenuPosition = signal({ top: 0, left: 0 });
  readonly error = signal('');

  setStatus(item: SupplierCertification, status: CertificationStatus, menu: HTMLDetailsElement): void {
    menu.open = false;
    menu.querySelector('summary')?.focus();
    if (!this.canUpdateStatus() || status === item.status) return;
    this.error.set('');
    this.updatingStatusId.set(item.certificationId);
    this.updateCertificationStatus.execute(item.certificationId, status).subscribe({
      next: () => {
        this.updatingStatusId.set(null);
        this.updated.emit();
      },
      error: () => {
        this.updatingStatusId.set(null);
        this.error.set(`Não foi possível atualizar o status de ${item.certification}.`);
      },
    });
  }

  positionStatusMenu(event: Event): void {
    const menu = event.currentTarget as HTMLDetailsElement;
    const summary = menu.querySelector('summary');
    if (!menu.open || !summary) return;
    const bounds = summary.getBoundingClientRect();
    const placeBelow = window.innerHeight - bounds.bottom >= MENU_HEIGHT + 12;
    const top = placeBelow ? bounds.bottom + 8 : Math.max(8, bounds.top - MENU_HEIGHT - 8);
    const left = Math.max(8, Math.min(bounds.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    this.statusMenuPosition.set({ top, left });
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
