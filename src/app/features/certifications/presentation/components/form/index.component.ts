import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateCertificationUseCase } from '../../../application/use-cases/create-certification/index.use-case';
import { NewCertification } from '../../../domain/index.model';

const REQUIRED_MESSAGES: Record<keyof NewCertification, string> = {
  certification: 'Informe o nome da certificação.',
  issuingBody: 'Informe a organização emissora.',
  issuedAt: 'Informe a data de emissão.',
  expiresAt: 'Informe a data de validade.',
};

@Component({
  selector: 'app-certification-form',
  imports: [ReactiveFormsModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly createCertification = inject(CreateCertificationUseCase);

  readonly supplierId = input.required<number>();
  readonly saved = output<void>();
  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    certification: ['', Validators.required],
    issuingBody: ['', Validators.required],
    issuedAt: ['', Validators.required],
    expiresAt: ['', Validators.required],
  });

  fieldError(field: keyof NewCertification): string {
    const control = this.form.controls[field];
    return control.touched && control.hasError('required') ? REQUIRED_MESSAGES[field] : '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.createCertification.execute(this.supplierId(), this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset();
        this.saved.emit();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');
      },
    });
  }
}
