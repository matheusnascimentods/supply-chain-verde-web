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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CertificationsService } from '../index.service';
import { CertificationRequestDTO } from '../index.schema';

@Component({
  selector: 'app-certifications-form',
  imports: [ReactiveFormsModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificationFormComponent implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CertificationsService);
  private previousFocus: HTMLElement | null = null;

  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;
  @ViewChild('firstField') private firstField?: ElementRef<HTMLInputElement>;

  readonly modal = input(false);
  readonly embedded = input(false);
  readonly supplierId = input.required<number>();
  readonly saved = output<void>();
  readonly dismissed = output<void>();
  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    issuingOrganization: ['', Validators.required],
    issuedAt: ['', Validators.required],
    expiresAt: ['', Validators.required],
  });

  ngAfterViewInit(): void {
    if (!this.modal() || this.embedded()) return;
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

  backdropClick(): void {
    if (!this.embedded()) this.closeModal();
  }

  handleDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.embedded()) return;
      event.preventDefault();
      event.stopPropagation();
      this.closeModal();
      return;
    }
    if (event.key !== 'Tab' || this.embedded()) return;

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
        issuedAt: 'a data de emissão',
        expiresAt: 'a data de validade',
      };
      return `Informe ${labels[field]}.`;
    }
    return '';
  }

  private data(): CertificationRequestDTO {
    return this.form.getRawValue();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.service.create(this.supplierId(), this.data()).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset();
        if (this.modal()) {
          this.saved.emit();
          return;
        }
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');
      },
    });
  }
}
