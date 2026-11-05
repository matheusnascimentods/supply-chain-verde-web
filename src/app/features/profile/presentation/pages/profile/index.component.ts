import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { CurrentUserService } from '../../../../../core/auth/session/current-user/index.service';
import { ROLE_LABELS } from '../../../../../core/auth/session/index.model';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { companyFormValue, formatCompanyFieldsWhileTyping } from '../../../../../shared/forms/company-fields/index.helper';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { CompanyForm } from '../../../domain/index.model';
import { accountPatch, accountsUsage, companyPatch, passwordChangeErrors } from '../../../domain/index.rules';
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
  private readonly repository = inject(ProfileRepository);
  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);
  // RF-10: o admin de qualquer tipo de companhia edita também a companhia; os demais, só o próprio acesso.
  readonly isAdmin = inject(SessionService).role() === 'admin';
  private initialCompany: CompanyForm | null = null;
  private initialUserName: string | null = null;

  readonly saving = signal(false);
  readonly error = signal('');
  readonly plan = signal<{ name: string; usage: string } | null>(null);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    cnpj: [{ value: '', disabled: true }],
    email: ['', Validators.email],
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
    formatCompanyFieldsWhileTyping(this.form.controls);
    const company$ = this.isAdmin
      ? forkJoin({ company: this.repository.getMyCompany(), usedAccounts: this.repository.countCompanyUsers() })
      : of(null);
    forkJoin({ user: this.currentUser.load(), company: company$ }).subscribe({
      next: ({ user, company }) => {
        this.account.patchValue({ userName: user.name, email: user.email, role: ROLE_LABELS[user.role] });
        this.initialUserName = user.name;
        if (!company) return;
        this.form.patchValue({ ...companyFormValue(company.company), email: company.company.email ?? '' });
        this.initialCompany = this.companyForm();
        const plan = company.company.plan;
        if (plan) this.plan.set({ name: plan.name, usage: accountsUsage(company.usedAccounts, plan.maxUsers) });
      },
      error: () => this.error.set('Não foi possível carregar o seu perfil.'),
    });
  }

  // Fora do admin, os campos da companhia não aparecem e não podem bloquear o envio.
  invalid(): boolean {
    return (this.isAdmin && this.form.invalid) || this.account.invalid;
  }

  submit(): void {
    const loaded = this.initialUserName !== null && (!this.isAdmin || this.initialCompany !== null);
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
        this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'Não foi possível salvar. Confira os dados e tente novamente.'));
      },
    });
  }

  // Companhia em PATCH /companies/me e acesso em PATCH /users/me, cada um só com o que mudou.
  private save(): Observable<unknown> {
    const password = this.account.getRawValue();
    const requests: Observable<unknown>[] = [];
    if (this.initialCompany) {
      const company = companyPatch(this.initialCompany, this.companyForm());
      if (Object.keys(company).length) requests.push(this.repository.updateMyCompany(company));
    }
    const account = accountPatch(this.initialUserName ?? '', password.userName, password);
    if (Object.keys(account).length) requests.push(this.repository.updateMe(account));
    return requests.length ? forkJoin(requests) : of(null);
  }

  private companyForm(): CompanyForm {
    const { name, cnpj: _cnpj, email, phone, ...address } = this.form.getRawValue();
    return { name, email, phone, address };
  }
}
