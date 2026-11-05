import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SuppliersListFacade } from '../../../application/index.facade';
import { SupplierRanking } from '../../../domain/index.model';
import { SupplierListComponent } from './index.component';

describe('SupplierListComponent', () => {
  let fixture: ComponentFixture<SupplierListComponent>;
  const supplier = (supplierId: number, extra: Partial<SupplierRanking> = {}): SupplierRanking => ({
    supplierId,
    name: `Fornecedor ${supplierId}`,
    cnpj: '12345678000190',
    sustainabilityScore: 87.5,
    activeCertificationCount: 1,
    totalCo2Kg: 1234.5,
    reportCount: 2,
    certifications: [],
    workedWith: false,
    ...extra,
  });
  const expired = { certificationId: 1, certification: 'ISO', issuingBody: 'ABNT', issuedAt: '', expiresAt: '', status: 'EXPIRED' as const };

  function render(overrides: Record<string, unknown> = {}): HTMLElement {
    const facade = {
      ranking: signal([]),
      podium: signal([supplier(1)]),
      tableItems: signal([supplier(4, { certifications: [expired] }), supplier(5, { activeCertificationCount: 0 })]),
      firstTablePosition: signal(4),
      loading: signal(false),
      error: signal(''),
      search: signal(''),
      canFilterWorkedWith: true,
      workedWithOnly: signal(false),
      setWorkedWithOnly: vi.fn(),
      totalPages: signal(1),
      pageNumber: signal(1),
      reportsSupplier: signal(null),
      certificationsSupplier: signal(null),
      canGenerateReports: signal(true),
      canUpdateCertificationStatus: signal(true),
      canOpenReports: () => true,
      canCreateCertificationFor: () => true,
      load: vi.fn(),
      searchFor: vi.fn(),
      previousPage: vi.fn(),
      nextPage: vi.fn(),
      ...overrides,
    };
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.overrideComponent(SupplierListComponent, { set: { providers: [{ provide: SuppliersListFacade, useValue: facade }] } });
    fixture = TestBed.createComponent(SupplierListComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('renders the podium and the ranking table with formatted values', () => {
    const page = render();
    expect(page.querySelector('.podium-card')?.getAttribute('data-position')).toBe('1');
    const firstRow = page.querySelector('tbody tr') as HTMLElement;
    expect(firstRow.textContent).toContain('4');
    expect(firstRow.textContent).toContain('12.345.678/0001-90');
    expect(firstRow.textContent).toContain('1.234,5 kg');
  });

  it('summarizes the certification situation with a tone for styling', () => {
    const summaries = Array.from(render().querySelectorAll('.certification-summary'));
    expect(summaries[0].textContent?.trim()).toBe('1 expirada');
    expect(summaries[0].getAttribute('data-tone')).toBe('expired');
    expect(summaries[1].textContent?.trim()).toBe('Nenhuma ativa');
    expect(summaries[1].getAttribute('data-tone')).toBe('none');
  });

  it('shows the error with a retry action when the ranking fails', () => {
    const load = vi.fn();
    const page = render({ error: signal('Não foi possível carregar os fornecedores e o ranking. Tente novamente.'), load });
    expect(page.textContent).toContain('Não foi possível carregar os fornecedores e o ranking.');
    page.querySelector<HTMLButtonElement>('.suppliers-retry')!.click();
    expect(load).toHaveBeenCalled();
  });

  it('shows the "Já trabalhou" badge only on suppliers the company worked with', () => {
    const page = render({ podium: signal([supplier(1, { workedWith: true })]) });
    expect(page.querySelector('.podium-card')?.textContent).toContain('Já trabalhou');
    expect(page.querySelector('tbody tr')?.textContent).not.toContain('Já trabalhou');
  });

  it('toggles the worked-with filter next to the search', () => {
    const setWorkedWithOnly = vi.fn();
    const page = render({ setWorkedWithOnly });
    const toggle = page.querySelector<HTMLInputElement>('#worked-with-only')!;
    expect(toggle.checked).toBe(false);
    toggle.click();
    expect(setWorkedWithOnly).toHaveBeenCalledWith(true);
  });

  it('hides the filter when it does not apply (platform admin)', () => {
    expect(render({ canFilterWorkedWith: false }).querySelector('#worked-with-only')).toBeNull();
  });

  it('is a ranking only: no create button, no supplier modal and no clickable name', () => {
    const page = render();
    expect(page.textContent).not.toContain('Novo fornecedor');
    expect(page.querySelector('app-create-supplier-modal')).toBeNull();
    expect(page.querySelector('.supplier-link')).toBeNull();
    expect(page.querySelector('.supplier-name')?.textContent).toContain('Fornecedor 4');
  });
});
