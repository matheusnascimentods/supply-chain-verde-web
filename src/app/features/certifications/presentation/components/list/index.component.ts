import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { CloseOnOutsideClickDirective } from '../../../../../shared/directives/close-on-outside-click/index.directive';
import { localDateDaysAgo } from '../../../../../shared/utils/date/index.utils';
import { formatIsoDateBr } from '../../../../../shared/utils/format/index.utils';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { UpdateCertificationStatusUseCase } from '../../../application/use-cases/update-status/index.use-case';
import { CERTIFICATION_STATUSES, CERTIFICATION_STATUS_LABELS, Certification, CertificationStatus } from '../../../domain/index.model';

/** O que a lista mostra de cada certificação; o ranking de fornecedores manda a certificação sem o supplierId. */
export type CertificationItem = Omit<Certification, 'supplierId'>;

const MENU_HEIGHT = 176;
const MENU_WIDTH = 176;

/**
 * Lista de certificações com o status de cada uma. Com `canUpdateStatus`, o status vira um menu para o
 * fornecedor dono trocá-lo (RF-17); sem ele, é só leitura, como no modal da tela de Fornecedores.
 */
@Component({
  selector: 'app-certification-list',
  imports: [CloseOnOutsideClickDirective],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificationListComponent {
  private readonly updateCertificationStatus = inject(UpdateCertificationStatusUseCase);
  protected readonly date = formatIsoDateBr;
  protected readonly statuses = CERTIFICATION_STATUSES;
  protected readonly statusLabels = CERTIFICATION_STATUS_LABELS;
  protected readonly today = localDateDaysAgo(0);

  readonly certifications = input.required<readonly CertificationItem[]>();
  readonly canUpdateStatus = input(false);
  readonly emptyMessage = input('Nenhuma certificação cadastrada.');
  readonly updated = output<void>();
  readonly updatingStatusId = signal<number | null>(null);
  readonly statusMenuPosition = signal({ top: 0, left: 0 });
  readonly error = signal('');

  /** A API recusa reativar certificação vencida. */
  protected isExpired(item: CertificationItem): boolean {
    return item.expiresAt < this.today;
  }

  setStatus(item: CertificationItem, status: CertificationStatus, menu: HTMLDetailsElement): void {
    menu.open = false;
    menu.querySelector('summary')?.focus();
    if (!this.canUpdateStatus() || status === item.status || (status === 'ACTIVE' && this.isExpired(item))) return;
    this.error.set('');
    this.updatingStatusId.set(item.certificationId);
    this.updateCertificationStatus.execute(item.certificationId, status).subscribe({
      next: () => {
        this.updatingStatusId.set(null);
        this.updated.emit();
      },
      error: (error: unknown) => {
        this.updatingStatusId.set(null);
        this.error.set(apiErrorMessage(error, `Não foi possível atualizar o status de ${item.certification}.`));
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
    const options = Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]:not(:disabled)'));
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
