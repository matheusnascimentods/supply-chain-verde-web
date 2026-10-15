import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NewSupplier, formatSupplierFieldsWhileTyping, lookUpSupplierZipCode } from '../../../../suppliers';

@Component({
  selector: 'app-new-supplier-form',
  imports: [ReactiveFormsModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewSupplierFormComponent {
  readonly submitted = output<NewSupplier>();
  readonly incomplete = output<void>();

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
  private readonly zipCodeLookup = lookUpSupplierZipCode(this.form);
  readonly cepLoading = this.zipCodeLookup.loading;
  readonly cepMessage = this.zipCodeLookup.message;

  constructor() {
    formatSupplierFieldsWhileTyping(this.form.controls);
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
}
