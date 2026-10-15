import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { CreateSupplierUseCase } from '../../../application/use-cases/create-supplier/index.use-case';
import { formatSupplierFieldsWhileTyping, lookUpSupplierZipCode } from '../../supplier-fields/index.helper';

@Component({
  selector: 'app-create-supplier-modal',
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSupplierModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly createSupplier = inject(CreateSupplierUseCase);

  readonly created = output<void>();
  readonly dismissed = output<void>();

  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    cnpj: ['', Validators.required],
    phone: ['', Validators.required],
    street: ['', Validators.required],
    number: ['', Validators.required],
    neighborhood: ['', Validators.required],
    complement: [''],
    zipCode: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
  });
  private readonly zipCodeLookup = lookUpSupplierZipCode(this.form);
  readonly cepLoading = this.zipCodeLookup.loading;
  readonly cepMessage = this.zipCodeLookup.message;
  // Acesso opcional (usuário SUPPLIER) criado junto com o fornecedor.
  readonly withAccess = this.fb.nonNullable.control(false);
  readonly access = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    formatSupplierFieldsWhileTyping(this.form.controls);
    this.access.disable();
    this.withAccess.valueChanges.pipe(takeUntilDestroyed()).subscribe((enabled) => (enabled ? this.access.enable() : this.access.disable()));
  }

  invalid(): boolean {
    return this.form.invalid || this.access.invalid;
  }

  submit(): void {
    if (this.invalid()) {
      this.form.markAllAsTouched();
      this.access.markAllAsTouched();
      return;
    }
    const { name, cnpj, phone, ...address } = this.form.getRawValue();
    const user = this.access.enabled ? { user: this.access.getRawValue() } : {};
    this.saving.set(true);
    this.error.set('');
    this.createSupplier.execute({ name, cnpj, phone, address, ...user }).subscribe({
      next: () => {
        this.saving.set(false);
        this.created.emit();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'Não foi possível salvar. Confira os dados e tente novamente.'));
      },
    });
  }
}
