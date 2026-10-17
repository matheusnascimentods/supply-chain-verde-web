import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { localDateDaysAgo } from '../../../../../shared/utils/date/index.utils';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { CreateCertificationUseCase } from '../../../application/use-cases/create-certification/index.use-case';
import { NewCertification } from '../../../domain/index.model';

const REQUIRED_MESSAGES: Record<keyof NewCertification, string> = {
  certification: 'Informe o nome da certificação.',
  issuingBody: 'Informe a organização emissora.',
  issuedAt: 'Informe a data de emissão.',
  expiresAt: 'Informe a data de validade.',
};

// Datas yyyy-MM-dd ordenam como texto, então a comparação dispensa Date.
function notBefore(min: () => string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    control.value && control.value < min() ? { past: true } : null;
}

function notBeforeField(field: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const other = control.parent?.get(field)?.value;
    return control.value && other && control.value < other ? { beforeIssue: true } : null;
  };
}

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
  readonly today = localDateDaysAgo(0);

  readonly form = this.fb.nonNullable.group({
    certification: ['', Validators.required],
    issuingBody: ['', Validators.required],
    issuedAt: ['', Validators.required],
    expiresAt: ['', [Validators.required, notBefore(() => this.today), notBeforeField('issuedAt')]],
  });

  constructor() {
    this.form.controls.issuedAt.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.expiresAt.updateValueAndValidity());
  }

  fieldError(field: keyof NewCertification): string {
    const control = this.form.controls[field];
    if (!control.touched) return '';
    if (control.hasError('required')) return REQUIRED_MESSAGES[field];
    if (control.hasError('past')) return 'A validade não pode estar no passado.';
    if (control.hasError('beforeIssue')) return 'A validade deve ser igual ou posterior à emissão.';
    return '';
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
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'Não foi possível salvar. Confira os dados e tente novamente.'));
      },
    });
  }
}
