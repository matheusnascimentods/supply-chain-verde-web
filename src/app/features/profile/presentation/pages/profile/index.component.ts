import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { CurrentUserService } from '../../../../../core/auth/session/current-user/index.service';
import { ROLE_LABELS } from '../../../../../core/auth/session/index.model';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import {
  formatSupplierFieldsWhileTyping,
  OwnSupplierProfile,
  supplierFormValue,
  SuppliersRepository,
  UpdateOwnSupplierUseCase,
} from '../../../../suppliers';
import { accountPatch, passwordChangeErrors } from '../../../domain/index.rules';
import { ProfileRepository } from '../../../infrastructure/index.repository';

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
  private readonly profileRepository = inject(ProfileRepository);
  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  // Fornecedor edita também a empresa (o vinculado à sessão); os demais perfis, só o próprio acesso.
  readonly isSupplier = this.session.role() === 'supplier';
  private readonly supplierId = this.session.supplierId();
  private initialProfile: OwnSupplierProfile | null = null;
  private initialUserName: string | null = null;

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
      role: [{ value: '', disabled: true }],
      currentPassword: [''],
      newPassword: [''],
      confirmPassword: [''],
    },
    { validators: (group) => passwordChangeErrors(group.getRawValue()) },
  );

  constructor() {
    if (!this.isSupplier) {
      this.currentUser.load().subscribe({
        next: (user) => {
          this.account.patchValue({ userName: user.name, email: user.email, role: ROLE_LABELS[user.role] });
          this.initialUserName = user.name;
        },
        error: () => this.error.set('Não foi possível carregar o seu perfil.'),
      });
      return;
    }
    formatSupplierFieldsWhileTyping(this.form.controls);
    if (!this.supplierId) {
      this.error.set('Não foi possível identificar o fornecedor desta sessão.');
      return;
    }
    this.form.controls.cnpj.disable();
    forkJoin({ supplier: this.repository.get(this.supplierId), user: this.currentUser.load() }).subscribe({
      next: ({ supplier, user }) => {
        this.form.patchValue(supplierFormValue(supplier));
        this.account.patchValue({ userName: user.name, email: user.email, role: ROLE_LABELS[user.role] });
        this.initialProfile = this.ownProfile();
      },
      error: () => this.error.set('Não foi possível carregar o fornecedor.'),
    });
  }

  // Fora do fornecedor, os campos da empresa não aparecem e não podem bloquear o envio.
  invalid(): boolean {
    return (this.isSupplier && this.form.invalid) || this.account.invalid;
  }

  submit(): void {
    const loaded = this.isSupplier ? this.initialProfile : this.initialUserName;
    if (this.invalid() || loaded === null) {
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

  private save(): Observable<unknown> {
    const password = this.account.getRawValue();
    if (this.isSupplier && this.initialProfile) {
      return this.updateOwnSupplier.execute(this.initialProfile, this.ownProfile(), password);
    }
    const patch = accountPatch(this.initialUserName ?? '', password.userName, password);
    return Object.keys(patch).length ? this.profileRepository.updateMe(patch) : of(null);
  }

  private ownProfile(): OwnSupplierProfile {
    const { name, cnpj: _cnpj, phone, ...address } = this.form.getRawValue();
    return { name, phone, address, userName: this.account.controls.userName.value };
  }
}
