import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CertificationsService } from '../index.service';
import { CertificationRequestDTO } from '../index.schema';

@Component({
  selector: 'app-certifications-form',
  imports: [ReactiveFormsModule, RouterLink, NgTemplateOutlet],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificationFormComponent implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CertificationsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private previousFocus: HTMLElement | null = null;

  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;
  @ViewChild('firstField') private firstField?: ElementRef<HTMLInputElement>;

  readonly modal = input(false);
  readonly saved = output<void>();
  readonly dismissed = output<void>();
  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    issuingOrganization: ['', Validators.required],
    certificationNumber: ['', Validators.required],
    issuedAt: ['', Validators.required],
    expiresAt: ['', Validators.required],
    documentUrl: ['', Validators.pattern(/^https?:\/\/\S+$/i)],
  });

  ngAfterViewInit(): void {
    if (!this.modal()) return;
    this.previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    queueMicrotask(() => this.firstField?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    this.previousFocus?.focus();
  }

  closeModal(): void {
    if (!this.saving()) this.dismissed.emit();
  }

  handleDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeModal();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = this.dialog?.nativeElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) {
      event.preventDefault();
      this.dialog?.nativeElement.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  fieldError(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];
    if (!control.touched) return '';

    if (control.hasError('required')) {
      const labels = {
        name: 'o nome da certificação',
        issuingOrganization: 'a organização emissora',
        certificationNumber: 'o número da certificação',
        issuedAt: 'a data de emissão',
        expiresAt: 'a data de validade',
        documentUrl: 'a URL do documento',
      };
      return `Informe ${labels[field]}.`;
    }
    if (field === 'documentUrl' && control.hasError('pattern')) {
      return 'Informe uma URL válida começando com http:// ou https://.';
    }
    return '';
  }

  private data(): CertificationRequestDTO {
    const value = this.form.getRawValue();
    return {
      ...value,
      documentUrl: value.documentUrl.trim() || undefined,
    };
  }

  private authenticatedSupplierId(): number | null {
    const value = Number(sessionStorage.getItem('supplierId'));
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const supplierId = this.authenticatedSupplierId();
    if (supplierId === null) {
      this.error.set('Não foi possível identificar o fornecedor desta sessão. Entre novamente.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.service.create(supplierId, this.data()).subscribe({
      next: () => {
        this.saving.set(false);
        if (this.modal()) {
          this.saved.emit();
          return;
        }
        this.router.navigate(['/certifications']);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');
      },
    });
  }
}
