import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CurrentUserService } from '../../../../../core/auth/session/current-user/index.service';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import {
  formatSupplierFieldsWhileTyping,
  OwnSupplierProfile,
  passwordChangeErrors,
  supplierFormValue,
  SuppliersRepository,
  UpdateOwnSupplierUseCase,
} from '../../../../suppliers';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly repository = inject(SuppliersRepository);
  private readonly updateOwnSupplier = inject(UpdateOwnSupplierUseCase);
  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  // /profile: o fornecedor vinculado à sessão. Admin/manager editam pelo modal da lista.
  private readonly supplierId = this.session.supplierId();
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
  // Nome do usuário, email (leitura) e troca de senha.
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
    formatSupplierFieldsWhileTyping(this.form.controls);
    if (!this.supplierId) {
      this.error.set('Não foi possível identificar o fornecedor desta sessão.');
      return;
    }
    this.form.controls.cnpj.disable();
    forkJoin({ supplier: this.repository.get(this.supplierId), user: this.currentUser.load() }).subscribe({
      next: ({ supplier, user }) => {
        this.form.patchValue(supplierFormValue(supplier));
        this.account.patchValue({ userName: user.name, email: user.email });
        this.initialProfile = this.ownProfile();
      },
      error: () => this.error.set('Não foi possível carregar o fornecedor.'),
    });
  }

  invalid(): boolean {
    return this.form.invalid || this.account.invalid;
  }

  submit(): void {
    if (this.invalid() || !this.initialProfile) {
      this.form.markAllAsTouched();
      this.account.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.updateOwnSupplier.execute(this.initialProfile, this.ownProfile(), this.account.getRawValue()).subscribe({
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

  private ownProfile(): OwnSupplierProfile {
    const { name, cnpj: _cnpj, phone, ...address } = this.form.getRawValue();
    return { name, phone, address, userName: this.account.controls.userName.value };
  }
}
