import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { formatCompanyFieldsWhileTyping, lookUpCompanyZipCode } from '../../../../../shared/forms/company-fields/index.helper';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';
import { ErrorToastComponent } from '../../../../../shared/ui/error-toast/index.component';
import { ErrorToastService } from '../../../../../shared/ui/error-toast/index.service';
import { SpinnerComponent } from '../../../../../shared/ui/spinner/index.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { digitsOnly } from '../../../../../shared/utils/format/index.utils';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { SignUpConflict, SignUpUseCase } from '../../../application/use-cases/sign-up/index.use-case';
import { COMPANY_TYPE_LABELS, CompanySignup, MIN_PASSWORD_LENGTH, Plan, SignupCompanyType, passwordErrors } from '../../../domain/index.model';
import { SignupRepository } from '../../../infrastructure/index.repository';
import { PublicHeaderComponent } from '../../components/public-header/index.component';

const FIELD_MESSAGES: Record<string, string> = {
  required: 'Campo obrigatório.',
  email: 'Informe um email válido.',
  pattern: 'Formato inválido.',
};

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, ErrorToastComponent, SpinnerComponent, TextFieldComponent, PublicHeaderComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly signUp = inject(SignUpUseCase);
  private readonly toast = inject(ErrorToastService);
  private readonly injector = inject(Injector);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  protected readonly steps = ['Empresa', 'Administrador', 'Revisão'];
  protected readonly typeLabels = COMPANY_TYPE_LABELS;
  protected readonly companyTypes = Object.entries(COMPANY_TYPE_LABELS);
  protected readonly step = signal(0);
  protected readonly plan = signal<Plan | null>(null);
  protected readonly saving = signal(false);

  protected readonly companyForm = this.fb.nonNullable.group({
    type: ['MARKET' as SignupCompanyType, Validators.required],
    name: ['', Validators.required],
    cnpj: ['', [Validators.required, Validators.pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{4,5}-\d{4}$/)]],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}-\d{3}$/)]],
    state: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
    street: ['', Validators.required],
    number: ['', Validators.required],
    neighborhood: ['', Validators.required],
    complement: [''],
    city: ['', Validators.required],
  });
  protected readonly adminForm = this.fb.nonNullable.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    },
    { validators: (group) => passwordErrors(group.getRawValue()) },
  );
  protected readonly zipCodeLookup = lookUpCompanyZipCode(this.companyForm);

  constructor() {
    formatCompanyFieldsWhileTyping(this.companyForm.controls);
    const code = inject(ActivatedRoute).snapshot.queryParamMap.get('plano');
    inject(SignupRepository)
      .listPlans()
      .subscribe({
        next: (plans) => {
          const plan = plans.find((candidate) => candidate.code === code);
          if (plan) this.plan.set(plan);
          else this.backToPlans();
        },
        error: () => this.backToPlans(),
      });
  }

  protected fieldError(control: AbstractControl): string {
    if (!control.touched || !control.errors) return '';
    const [key, value] = Object.entries(control.errors)[0];
    return key === 'conflict' ? String(value) : (FIELD_MESSAGES[key] ?? 'Valor inválido.');
  }

  protected passwordError(): string {
    const { password } = this.adminForm.controls;
    if (!password.touched) return '';
    if (password.hasError('required')) return FIELD_MESSAGES['required'];
    return this.adminForm.hasError('passwordTooShort') ? `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` : '';
  }

  protected confirmPasswordError(): string {
    const { confirmPassword } = this.adminForm.controls;
    if (!confirmPassword.touched) return '';
    if (confirmPassword.hasError('required')) return FIELD_MESSAGES['required'];
    return this.adminForm.hasError('passwordMismatch') ? 'As senhas não conferem.' : '';
  }

  protected next(): void {
    const form = [this.companyForm, this.adminForm][this.step()];
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    this.goTo(this.step() + 1);
  }

  protected back(): void {
    this.goTo(this.step() - 1);
  }

  protected submit(): void {
    const plan = this.plan();
    if (!plan || this.saving()) return;
    this.saving.set(true);
    this.signUp.execute(this.payload(plan.code)).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (error: unknown) => {
        this.saving.set(false);
        if (!(error instanceof SignUpConflict)) {
          this.toast.show(apiErrorMessage(error, 'Não foi possível concluir o cadastro. Tente novamente.'));
          return;
        }
        // Validador em vez de setErrors: o input é recriado ao voltar de passo e revalida o controle.
        const control = error.step === 'company' ? this.companyForm.controls.cnpj : this.adminForm.controls.email;
        const taken = control.value;
        control.addValidators((current) => (current.value === taken ? { conflict: error.message } : null));
        control.updateValueAndValidity();
        control.markAsTouched();
        this.goTo(error.step === 'company' ? 0 : 1);
      },
    });
  }

  private payload(planCode: string): CompanySignup {
    const { type, name, cnpj, email, phone, complement, zipCode, state, ...address } = this.companyForm.getRawValue();
    const admin = this.adminForm.getRawValue();
    return {
      planCode,
      type,
      company: {
        name,
        cnpj: digitsOnly(cnpj),
        email,
        phone: digitsOnly(phone),
        address: { ...address, complement: complement || null, zipCode: digitsOnly(zipCode), state: state.toUpperCase() },
      },
      admin: { name: admin.name, email: admin.email, password: admin.password },
    };
  }

  // RNF-02: ao trocar de passo, o foco vai para o título do novo passo.
  private goTo(step: number): void {
    this.step.set(step);
    afterNextRender(() => this.stepHeading()?.nativeElement.focus(), { injector: this.injector });
  }

  private backToPlans(): void {
    this.router.navigate(['/planos'], { replaceUrl: true });
  }
}
