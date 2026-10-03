import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, computed, inject, input, output, signal } from '@angular/core';
import { SupplierCertificationDTO } from '../../index.schema';
import { CertificationsService } from '../../../certifications/index.service';
import { CertificationStatus } from '../../../certifications/index.schema';
import { CertificationFormComponent } from '../../../certifications/form/index.component';

@Component({
  selector: 'app-supplier-certifications-modal',
  imports: [CertificationFormComponent],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierCertificationsModalComponent implements AfterViewInit, OnDestroy {
  private readonly service = inject(CertificationsService);
  private previousFocus: HTMLElement | null = null;
  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;
  readonly supplierId = input.required<number>();
  readonly supplierName = input.required<string>();
  readonly certifications = input.required<SupplierCertificationDTO[]>();
  readonly canCreate = input(false);
  readonly canUpdateStatus = input(false);
  readonly updated = output<void>();
  readonly dismissed = output<void>();
  readonly formOpen = signal(false);
  readonly updatingStatusId = signal<number | null>(null);
  readonly error = signal('');
  readonly items = computed(() => this.certifications());
  readonly statuses: { value: CertificationStatus; label: string }[] = [
    { value: 'active', label: 'Ativa' },
    { value: 'expired', label: 'Expirada' },
    { value: 'suspended', label: 'Suspensa' },
    { value: 'underReview', label: 'Em análise' },
  ];

  ngAfterViewInit(): void {
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    queueMicrotask(() => this.dialog?.nativeElement.focus());
  }

  ngOnDestroy(): void { this.previousFocus?.focus(); }

  close(): void { this.dismissed.emit(); }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;
    const elements = this.dialog?.nativeElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!elements?.length) {
      event.preventDefault();
      this.dialog?.nativeElement.focus();
      return;
    }
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

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

  setStatus(item: SupplierCertificationDTO, value: string): void {
    const status = value as CertificationStatus;
    if (!this.canUpdateStatus() || status === this.status(item.status)) return;
    this.error.set('');
    this.updatingStatusId.set(item.certificationId);
    this.service.updateStatus(item.certificationId, status).subscribe({
      next: () => { this.updatingStatusId.set(null); this.updated.emit(); },
      error: () => { this.updatingStatusId.set(null); this.error.set(`Não foi possível atualizar o status de ${item.certification}.`); },
    });
  }

  certificationCreated(): void {
    this.formOpen.set(false);
    this.updated.emit();
  }
}
