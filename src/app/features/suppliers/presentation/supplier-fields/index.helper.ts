import { inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { catchError, distinctUntilChanged, finalize, map, of, startWith, switchMap, tap, timer } from 'rxjs';
import { ViaCepService } from '../../../../core/integrations/via-cep/index.service';
import { digitsOnly, formatCnpj, formatPhone, formatZipCode } from '../../../../shared/utils/format/index.utils';
import { Address } from '../../domain/index.model';
import { addressFromViaCep } from '../../domain/value-objects/address/index.vo';

const ZIP_CODE_LOOKUP_DELAY = 350;

type FormattedControls = { cnpj: FormControl<string>; phone: FormControl<string>; zipCode: FormControl<string> };
type ZipCodeForm = {
  controls: { zipCode: FormControl<string> };
  patchValue(value: Partial<Pick<Address, 'street' | 'neighborhood' | 'city' | 'state'>>, options?: { emitEvent?: boolean }): void;
};

// Chamar no construtor (contexto de injeção): formata CNPJ, telefone e CEP enquanto o usuário digita.
export function formatSupplierFieldsWhileTyping({ cnpj, phone, zipCode }: FormattedControls): void {
  const fields = [
    [cnpj, formatCnpj],
    [phone, formatPhone],
    [zipCode, formatZipCode],
  ] as const;
  for (const [control, formatter] of fields) {
    control.valueChanges.pipe(startWith(control.value), distinctUntilChanged(), takeUntilDestroyed()).subscribe((value) => {
      const formatted = formatter(value);
      if (formatted !== value) control.setValue(formatted, { emitEvent: false });
    });
  }
}

// Chamar no construtor (contexto de injeção): com 8 dígitos no CEP, busca no ViaCEP e preenche o endereço.
export function lookUpSupplierZipCode(form: ZipCodeForm) {
  const viaCep = inject(ViaCepService);
  const loading = signal(false);
  const message = signal('');
  const zipCode = form.controls.zipCode;
  zipCode.valueChanges
    .pipe(
      startWith(zipCode.value),
      map(digitsOnly),
      distinctUntilChanged(),
      switchMap((digits) => {
        message.set('');
        if (digits.length !== 8) {
          loading.set(false);
          return of(null);
        }
        loading.set(true);
        return timer(ZIP_CODE_LOOKUP_DELAY).pipe(
          switchMap(() => viaCep.lookup(digits)),
          tap((response) => {
            const lookup = addressFromViaCep(response);
            if (!lookup.found) {
              message.set('CEP não encontrado. Confira o número ou preencha o endereço manualmente.');
              return;
            }
            form.patchValue(lookup.address, { emitEvent: false });
            message.set('Endereço localizado. Confira os dados antes de salvar.');
          }),
          catchError(() => {
            message.set('Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.');
            return of(null);
          }),
          finalize(() => loading.set(false)),
        );
      }),
      takeUntilDestroyed(),
    )
    .subscribe();
  return { loading: loading.asReadonly(), message: message.asReadonly() };
}
