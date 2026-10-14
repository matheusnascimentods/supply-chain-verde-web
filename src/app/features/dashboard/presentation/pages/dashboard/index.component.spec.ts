import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { UserRole } from '../../../../../core/auth/session/index.model';
import { DashboardSummary } from '../../../domain/index.model';
import { DashboardRepository } from '../../../infrastructure/index.repository';
import { CurrentUserService } from '../../../../../core/auth/session/current-user/index.service';
import { DashboardComponent } from './index.component';

const summary: DashboardSummary = {
  activeBatches: 12,
  expiringCertifications: 3,
  suppliers: 8,
  monthlyEmissionKgCo2e: 42.5,
  recentBatches: [
    { batchId: 101, productName: 'Café orgânico', supplierName: 'Fazenda Verde', quantity: 500, unit: 'KG', status: 'TRANSPORT' },
    { batchId: 102, productName: 'Cacau fino', supplierName: 'Sítio Bom Fruto', quantity: 1.2, unit: 'TON', status: 'PRODUCTION' },
    { batchId: 103, productName: 'Mel silvestre', supplierName: 'Apiário Cerrado', quantity: 150, unit: 'LITER', status: 'TRANSPORT' },
  ],
};

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let session: SessionService;
  let dashboardService: { loadSummary: ReturnType<typeof vi.fn>; loadEmissions: ReturnType<typeof vi.fn> };
  let currentUserService: { load: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    sessionStorage.clear();
    dashboardService = {
      loadSummary: vi.fn().mockReturnValue(of(summary)),
      loadEmissions: vi.fn().mockReturnValue(of([{ month: '2026-01', co2Kg: 1000 }, { month: '2026-02', co2Kg: 696 }])),
    };
    currentUserService = {
      load: vi.fn().mockReturnValue(
        of({ userId: 5, name: 'Maria Gabriela Brito', email: 'maria@example.com', role: 'manager' }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        SessionService,
        { provide: DashboardRepository, useValue: dashboardService },
        { provide: CurrentUserService, useValue: currentUserService },
      ],
    }).compileComponents();
    session = TestBed.inject(SessionService);
  });

  afterEach(() => sessionStorage.clear());

  function renderAs(role: UserRole): HTMLElement {
    session.setSession('test-token', role, `${role}@supply.com`);
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('loads and displays all four KPI values returned by the API', () => {
    const page = renderAs('manager');
    expect(dashboardService.loadSummary).toHaveBeenCalledWith(10);
    expect(page.textContent).toContain('Lotes Ativos');
    expect(page.textContent).toContain('12');
    expect(page.textContent).toContain('Certificações Expirando');
    expect(page.textContent).toContain('3');
    expect(page.textContent).toContain('Fornecedores');
    expect(page.textContent).toContain('8');
    expect(page.textContent).toContain('42,5 kg CO₂e');
    expect(page.textContent).toContain('Olá, Maria Gabriela Brito');
    expect(currentUserService.load).toHaveBeenCalledOnce();
  });

  it('renders charts from the real status distribution in the latest batches', () => {
    const page = renderAs('admin');
    expect(page.textContent).toContain('Lotes recentes por etapa');
    expect(page.textContent).toContain('Etapas dos lotes recentes');
    expect(page.textContent).not.toContain('Quantidade por etapa');
    expect(page.textContent).toContain('Transporte');
    expect(page.textContent).toContain('Produção');
    expect(page.textContent).toContain('Distribuição dos lotes retornados pela API (até 10)');
    expect(page.textContent).not.toContain('Inventory Snapshot');
    expect(page.textContent).not.toContain('Filtros');
    expect(page.textContent).not.toContain('Administrador');
  });

  it('renders recent batches as a responsive table and links to the full batch list', () => {
    const page = renderAs('supplier');
    const rows = page.querySelectorAll('.dashboard-batches-table tbody tr');
    expect(page.textContent).toContain('Lotes recentes');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('Café orgânico');
    expect(rows[0].textContent).toContain('Fazenda Verde');
    expect(rows[0].textContent).toContain('500 kg');
    expect(rows[0].textContent).toContain('Transporte');
    expect(page.querySelector('a[routerLink="/batches"]')).toBeTruthy();
    expect(dashboardService.loadSummary).toHaveBeenCalledOnce();
  });

  it('shows an empty state when the API returns no recent batches', () => {
    dashboardService.loadSummary.mockReturnValue(of({ ...summary, recentBatches: [] }));
    const page = renderAs('auditor');
    expect(page.querySelector('.dashboard-batches-table tbody')).toBeNull();
    expect(page.textContent).toContain('Nenhum lote recente encontrado.');
  });

  it('shows a recoverable error when the summary request fails', () => {
    dashboardService.loadSummary.mockReturnValue(throwError(() => new Error('API unavailable')));
    const page = renderAs('manager');
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível carregar o resumo');
    expect(page.textContent).toContain('Tentar novamente');
  });

  it('shows the API user name and fallback content for an invalid session role', () => {
    const page = renderAs('supplier');
    expect(page.textContent).toContain('Olá, Maria Gabriela Brito');

    session.clearSession();
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Perfil indisponível');
  });

  it('titles the emissions chart by role and shows the period total and variation', () => {
    let page = renderAs('manager');
    expect(page.querySelector('#emissions-heading')?.textContent).toBe('Emissões da cadeia');
    expect(page.querySelector('app-emission-line-chart')).not.toBeNull();
    expect(page.querySelector('.dashboard-emissions-total')?.textContent).toBe('1.696 kg CO₂e');
    const change = page.querySelector('.dashboard-emissions-change')!;
    expect(change.textContent).toBe('▼ 30,4%');
    expect(change.getAttribute('data-tone')).toBe('down');

    page = renderAs('supplier');
    expect(page.querySelector('#emissions-heading')?.textContent).toBe('Suas emissões');
  });

  it('blocks an inverted month range without calling the API', () => {
    const page = renderAs('manager');
    const from = page.querySelector<HTMLInputElement>('#emissions-from')!;
    from.value = '2099-01';
    from.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(dashboardService.loadEmissions).toHaveBeenCalledOnce();
    expect(page.textContent).toContain('O mês inicial deve ser anterior ou igual ao final.');
  });

  it('shows the empty state when the period has no emissions', () => {
    dashboardService.loadEmissions.mockReturnValue(of([{ month: '2026-01', co2Kg: 0 }]));
    const page = renderAs('auditor');
    expect(page.textContent).toContain('Sem emissões no período.');
    expect(page.querySelector('app-emission-line-chart')).toBeNull();
  });
});
