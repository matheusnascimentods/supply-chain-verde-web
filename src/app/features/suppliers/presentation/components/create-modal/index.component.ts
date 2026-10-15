import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, startWith, switchMap } from 'rxjs';
import { ViaCepService } from '../../../../../core/integrations/via-cep/index.service';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { digitsOnly, formatCnpj, formatPhone, formatZipCode } from '../../../../../shared/utils/format/index.utils';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { CreateSupplierUseCase } from '../../../application/use-cases/create-supplier/index.use-case';
import { addressFromViaCep } from '../../../domain/value-objects/address/index.vo';

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
  private readonly viaCep = inject(ViaCepService);

  readonly created = output<void>();
  readonly dismissed = output<void>();

  readonly saving = signal(false);
  readonly error = signal('');
  readonly cepMessage = signal('');
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
  // Acesso opcional (usuário SUPPLIER) criado junto com o fornecedor.
  readonly withAccess = this.fb.nonNullable.control(false);
  readonly access = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    this.watchInputFormatting();
    this.lookUpZipCode();
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

  // Preenche o endereço pelo CEP, como no cadastro de fornecedor do lote.
  private lookUpZipCode(): void {
    this.form.controls.zipCode.valueChanges
      .pipe(
        map(digitsOnly),
        distinctUntilChanged(),
        debounceTime(350),
        filter((digits) => digits.length === 8),
        switchMap((digits) => this.viaCep.lookup(digits).pipe(map(addressFromViaCep), catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe((lookup) => {
        if (lookup?.found) this.form.patchValue(lookup.address);
        this.cepMessage.set(!lookup ? 'Não foi possível consultar o CEP. Preencha o endereço manualmente.' : lookup.found ? '' : 'CEP não encontrado. Confira o número ou preencha o endereço manualmente.');
      });
  }

  private watchInputFormatting(): void {
    const fields = [
      [this.form.controls.cnpj, formatCnpj],
      [this.form.controls.phone, formatPhone],
      [this.form.controls.zipCode, formatZipCode],
    ] as const;
    for (const [control, formatter] of fields) {
      control.valueChanges.pipe(startWith(control.value), distinctUntilChanged(), takeUntilDestroyed()).subscribe((value) => {
        const formatted = formatter(value);
        if (formatted !== value) control.setValue(formatted, { emitEvent: false });
      });
    }
  }
}
