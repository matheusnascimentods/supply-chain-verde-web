import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, distinctUntilChanged, finalize, map, of, startWith, switchMap, tap, timer } from 'rxjs';
import { ViaCepService } from '../../../../../core/integrations/via-cep/index.service';
import { digitsOnly, formatCnpj, formatPhone, formatZipCode } from '../../../../../shared/utils/format/index.utils';
import { NewSupplier, addressFromViaCep } from '../../../../suppliers';

const ZIP_CODE_LOOKUP_DELAY = 350;

@Component({
  selector: 'app-new-supplier-form',
  imports: [ReactiveFormsModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewSupplierFormComponent {
  private readonly viaCep = inject(ViaCepService);

  readonly submitted = output<NewSupplier>();
  readonly incomplete = output<void>();
  readonly cepLoading = signal(false);
  readonly cepMessage = signal('');

  readonly form = inject(FormBuilder).nonNullable.group({
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

  constructor() {
    this.formatWhileTyping();
    this.lookUpZipCode();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.incomplete.emit();
      return;
    }
    const { name, cnpj, phone, ...address } = this.form.getRawValue();
    this.submitted.emit({ name, cnpj, phone, address });
  }

  private formatWhileTyping(): void {
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

  private lookUpZipCode(): void {
    const zipCode = this.form.controls.zipCode;
    zipCode.valueChanges
      .pipe(
        startWith(zipCode.value),
        map(digitsOnly),
        distinctUntilChanged(),
        switchMap((digits) => {
          this.cepMessage.set('');
          if (digits.length !== 8) {
            this.cepLoading.set(false);
            return of(null);
          }
          this.cepLoading.set(true);
          return timer(ZIP_CODE_LOOKUP_DELAY).pipe(
            switchMap(() => this.viaCep.lookup(digits)),
            tap((response) => this.applyLookup(addressFromViaCep(response))),
            catchError(() => {
              this.cepMessage.set('Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.');
              return of(null);
            }),
            finalize(() => this.cepLoading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  private applyLookup(lookup: ReturnType<typeof addressFromViaCep>): void {
    if (!lookup.found) {
      this.cepMessage.set('CEP não encontrado. Confira o número ou preencha o endereço manualmente.');
      return;
    }
    this.form.patchValue(lookup.address, { emitEvent: false });
    this.cepMessage.set('Endereço localizado. Confira os dados antes de salvar.');
  }
}
