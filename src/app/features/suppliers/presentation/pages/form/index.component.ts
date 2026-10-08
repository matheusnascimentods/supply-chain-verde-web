import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { distinctUntilChanged, startWith } from 'rxjs';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { formatCnpj, formatPhone, formatZipCode } from '../../../../../shared/utils/format/index.utils';
import { UpdateSupplierUseCase } from '../../../application/use-cases/update-supplier/index.use-case';
import { NewSupplier } from '../../../domain/index.model';
import { SuppliersRepository } from '../../../infrastructure/index.repository';

@Component({
  selector: 'app-suppliers-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly repository = inject(SuppliersRepository);
  private readonly updateSupplier = inject(UpdateSupplierUseCase);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  // /suppliers/:id/edit edita o fornecedor da URL; /suppliers/me, o da sessão (supplierId = userId).
  private readonly supplierId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || this.session.userId();

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

  constructor() {
    this.watchInputFormatting();
    if (!this.supplierId) {
      this.error.set('Não foi possível identificar o fornecedor desta sessão.');
      return;
    }
    this.repository.get(this.supplierId).subscribe({
      next: (supplier) => this.form.patchValue({
        name: supplier.name,
        cnpj: supplier.cnpj ?? '',
        phone: supplier.phone ?? '',
        street: supplier.address?.street ?? '',
        number: supplier.address?.number ?? '',
        neighborhood: supplier.address?.neighborhood ?? '',
        complement: supplier.address?.complement ?? '',
        zipCode: supplier.address?.zipCode ?? '',
        city: supplier.address?.city ?? '',
        state: supplier.address?.state ?? '',
      }),
      error: () => this.error.set('Não foi possível carregar o fornecedor.'),
    });
  }

  submit(): void {
    if (this.form.invalid || !this.supplierId) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.updateSupplier.execute(this.supplierId, this.toSupplier()).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/suppliers']);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');
      },
    });
  }

  private toSupplier(): NewSupplier {
    const { name, cnpj, phone, ...address } = this.form.getRawValue();
    return { name, cnpj, phone, address };
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
