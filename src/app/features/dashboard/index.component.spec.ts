import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionService } from '../../core/session/index.service';
import { UserRole } from '../../core/session/index.schema';
import { DashboardComponent } from './index.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let session: SessionService;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), SessionService],
    }).compileComponents();
    session = TestBed.inject(SessionService);
  });

  afterEach(() => sessionStorage.clear());

  function renderAs(role: UserRole): HTMLElement {
    session.setSession('test-token', role);
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the dashboard summary for a manager', () => {
    const page = renderAs('manager');
    expect(page.textContent).toContain('Gestor');
    expect(page.textContent).toContain('Aqui está o resumo da sua operação hoje');
    expect(page.textContent).toContain('Lotes Ativos');
    expect(page.textContent).toContain('Lotes Recentes');
    expect(page.textContent).toContain('Café Orgânico Especial');
    expect(page.textContent).toContain('Certificações Expirando');
  });

  it('shows supplier-specific actions', () => {
    const page = renderAs('supplier');
    expect(page.textContent).toContain('Fornecedor');
    expect(page.textContent).toContain('Acompanhe seus lotes');
    expect(page.textContent).toContain('Lotes Recentes');
  });

  it('shows auditor-specific actions', () => {
    const page = renderAs('auditor');
    expect(page.textContent).toContain('Auditor');
    expect(page.textContent).toContain('Revise certificações');
    expect(page.textContent).toContain('Lotes Recentes');
  });

  it('shows admin-specific management actions', () => {
    const page = renderAs('admin');
    expect(page.textContent).toContain('Administrador');
    expect(page.textContent).toContain('Acesse as áreas de gestão');
    expect(page.textContent).toContain('Lotes Recentes');
  });

  it('shows a helpful fallback without a valid session role', () => {
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Perfil indisponível');
  });
});
