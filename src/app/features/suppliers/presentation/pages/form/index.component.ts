import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, distinctUntilChanged, forkJoin, of, startWith } from 'rxjs';
import { CurrentUserService } from '../../../../../core/auth/session/current-user/index.service';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { formatCnpj, formatPhone, formatZipCode } from '../../../../../shared/utils/format/index.utils';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { UpdateOwnSupplierUseCase } from '../../../application/use-cases/update-own-supplier/index.use-case';
import { UpdateSupplierUseCase } from '../../../application/use-cases/update-supplier/index.use-case';
import { NewSupplier, OwnSupplierProfile, Supplier } from '../../../domain/index.model';
import { passwordChangeErrors } from '../../../domain/index.rules';
import { SuppliersRepository } from '../../../infrastructure/index.repository';

type FormMode = 'edit' | 'me';

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
  private readonly updateOwnSupplier = inject(UpdateOwnSupplierUseCase);
  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly route = inject(ActivatedRoute).snapshot;
  // /suppliers/:id/edit edita o fornecedor da URL; /suppliers/me, o vinculado à sessão.
  readonly mode: FormMode = this.route.data?.['mode'] ?? 'edit';
  private readonly supplierId = this.mode === 'me' ? this.session.supplierId() : Number(this.route.paramMap.get('id')) || null;
  private initialProfile: OwnSupplierProfile | null = null;

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
  // Só em /suppliers/me: nome do usuário, email (leitura) e troca de senha.
  readonly account = this.fb.nonNullable.group(
    {
      userName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      currentPassword: [''],
      newPassword: [''],
      confirmPassword: [''],
    },
    { validators: (group) => passwordChangeErrors(group.getRawValue()) },
  );

  constructor() {
    this.watchInputFormatting();
    if (!this.supplierId) {
      this.error.set('Não foi possível identificar o fornecedor desta sessão.');
      return;
    }
    if (this.mode === 'me') this.form.controls.cnpj.disable();
    const user$ = this.mode === 'me' ? this.currentUser.load() : of(null);
    forkJoin({ supplier: this.repository.get(this.supplierId), user: user$ }).subscribe({
      next: ({ supplier, user }) => {
        this.fill(supplier);
        if (user) {
          this.account.patchValue({ userName: user.name, email: user.email });
          this.initialProfile = this.ownProfile();
        }
      },
      error: () => this.error.set('Não foi possível carregar o fornecedor.'),
    });
  }

  invalid(): boolean {
    return this.form.invalid || (this.mode === 'me' && this.account.invalid);
  }

  submit(): void {
    const loaded = this.supplierId && (this.mode === 'edit' || this.initialProfile);
    if (this.invalid() || !loaded) {
      this.form.markAllAsTouched();
      this.account.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.save().subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/suppliers']);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'Não foi possível salvar. Confira os dados e tente novamente.'));
      },
    });
  }

  private save(): Observable<Supplier | null> {
    return this.mode === 'me'
      ? this.updateOwnSupplier.execute(this.initialProfile!, this.ownProfile(), this.account.getRawValue())
      : this.updateSupplier.execute(this.supplierId!, this.toSupplier());
  }

  private fill(supplier: Supplier): void {
    this.form.patchValue({
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
    });
  }

  private toSupplier(): NewSupplier {
    const { name, cnpj, phone, ...address } = this.form.getRawValue();
    return { name, cnpj, phone, address };
  }

  private ownProfile(): OwnSupplierProfile {
    const { name, phone, address } = this.toSupplier();
    return { name, phone, address, userName: this.account.controls.userName.value };
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
