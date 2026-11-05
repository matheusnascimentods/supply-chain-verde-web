import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';
import { ViaCepService } from '../../../../../core/integrations/via-cep/index.service';
import { SignUpConflict, SignUpUseCase } from '../../../application/use-cases/sign-up/index.use-case';
import { SignupRepository } from '../../../infrastructure/index.repository';
import { SignUpComponent } from './index.component';

@Component({ template: '' })
class BlankComponent {}

describe('SignUpComponent', () => {
  const plans = [
    { code: 'BASIC', name: 'Basic', maxUsers: 3 },
    { code: 'PRO', name: 'Pro', maxUsers: 10 },
  ];
  const execute = vi.fn();
  let harness: RouterTestingHarness;
  let element: HTMLElement;

  async function open(url: string): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'cadastro', component: SignUpComponent },
          { path: 'planos', component: BlankComponent },
          { path: 'dashboard', component: BlankComponent },
        ]),
        { provide: SignupRepository, useValue: { listPlans: () => of(plans) } },
        { provide: SignUpUseCase, useValue: { execute } },
        { provide: ViaCepService, useValue: { lookup: () => of({ erro: true }) } },
      ],
    });
    harness = await RouterTestingHarness.create(url);
    element = harness.routeNativeElement!;
  }

  function type(id: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  async function click(selector: string): Promise<void> {
    element.querySelector<HTMLElement>(selector)!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  const heading = () => element.querySelector('h2')?.textContent?.trim();

  async function fillCompany(): Promise<void> {
    type('company-name', 'Mercado Bom Preço LTDA');
    type('company-cnpj', '12345678000190');
    type('company-phone', '11999990000');
    type('company-email', 'contato@bompreco.com');
    type('company-zip-code', '01001000');
    type('company-state', 'sp');
    type('company-street', 'Praça da Sé');
    type('company-number', '10');
    type('company-neighborhood', 'Sé');
    type('company-city', 'São Paulo');
    await click('[data-testid="sign-up-next"]');
  }

  async function fillAdmin(): Promise<void> {
    type('admin-name', 'Ana Souza');
    type('admin-email', 'ana@bompreco.com');
    type('admin-password', 'segredo123');
    type('admin-confirm-password', 'segredo123');
    await click('[data-testid="sign-up-next"]');
  }

  beforeEach(() => execute.mockReset());

  it('sends an unknown plan back to /planos', async () => {
    await open('/cadastro?plano=GOLD');
    expect(TestBed.inject(Router).url).toBe('/planos');
  });

  it('sends a missing plan back to /planos', async () => {
    await open('/cadastro');
    expect(TestBed.inject(Router).url).toBe('/planos');
  });

  it('does not advance while a company field is invalid', async () => {
    await open('/cadastro?plano=PRO');
    expect(element.textContent).toContain('Pro');
    await click('[data-testid="sign-up-next"]');
    expect(heading()).toBe('1. Empresa');
    expect(element.querySelector('#company-name-error')?.textContent).toContain('Campo obrigatório.');
  });

  it('does not advance when the passwords differ', async () => {
    await open('/cadastro?plano=PRO');
    await fillCompany();
    type('admin-name', 'Ana Souza');
    type('admin-email', 'ana@bompreco.com');
    type('admin-password', 'segredo123');
    type('admin-confirm-password', 'outra-senha');
    await click('[data-testid="sign-up-next"]');
    expect(heading()).toBe('2. Administrador');
    expect(element.textContent).toContain('As senhas não conferem.');
  });

  it('submits the signup with digits only and goes to the dashboard', async () => {
    execute.mockReturnValue(of({ token: 'jwt', expiresAt: '2099-01-01', role: 'admin' }));
    await open('/cadastro?plano=PRO');
    await fillCompany();
    await fillAdmin();
    expect(heading()).toBe('3. Revisão');

    await click('[data-testid="sign-up-submit"]');

    expect(execute).toHaveBeenCalledWith({
      planCode: 'PRO',
      type: 'MARKET',
      company: {
        name: 'Mercado Bom Preço LTDA',
        cnpj: '12345678000190',
        email: 'contato@bompreco.com',
        phone: '11999990000',
        address: { street: 'Praça da Sé', number: '10', neighborhood: 'Sé', complement: null, zipCode: '01001000', city: 'São Paulo', state: 'SP' },
      },
      admin: { name: 'Ana Souza', email: 'ana@bompreco.com', password: 'segredo123' },
    });
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('returns to the company step with the API message on a CNPJ conflict, keeping the typed data', async () => {
    execute.mockReturnValue(throwError(() => new SignUpConflict('company', 'CNPJ já cadastrado: 12345678000190')) as Observable<never>);
    await open('/cadastro?plano=PRO');
    await fillCompany();
    await fillAdmin();

    await click('[data-testid="sign-up-submit"]');

    expect(heading()).toBe('1. Empresa');
    expect(element.querySelector('#company-cnpj-error')?.textContent).toContain('CNPJ já cadastrado');
    expect(element.querySelector<HTMLInputElement>('#company-name')?.value).toBe('Mercado Bom Preço LTDA');
    expect(document.activeElement).toBe(element.querySelector('h2'));

    type('company-cnpj', '98765432000110');
    harness.detectChanges();
    expect(element.querySelector('#company-cnpj-error')).toBeNull();
  });

  it('returns to the admin step on an e-mail conflict', async () => {
    execute.mockReturnValue(throwError(() => new SignUpConflict('admin', 'Email já cadastrado: ana@bompreco.com')));
    await open('/cadastro?plano=PRO');
    await fillCompany();
    await fillAdmin();

    await click('[data-testid="sign-up-submit"]');

    expect(heading()).toBe('2. Administrador');
    expect(element.querySelector('#admin-email-error')?.textContent).toContain('Email já cadastrado');
  });

  it('keeps the review step and shows a toast on other errors', async () => {
    execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await open('/cadastro?plano=PRO');
    await fillCompany();
    await fillAdmin();

    await click('[data-testid="sign-up-submit"]');

    expect(heading()).toBe('3. Revisão');
    expect(element.textContent).toContain('Não foi possível concluir o cadastro');
  });
});
