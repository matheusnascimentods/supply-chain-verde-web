import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { CreateCertificationUseCase } from '../../../application/use-cases/create-certification/index.use-case';
import { UpdateCertificationStatusUseCase } from '../../../application/use-cases/update-status/index.use-case';
import { CertificationsRepository } from '../../../infrastructure/index.repository';
import { CertificationsPageComponent } from './index.component';

describe('CertificationsPageComponent', () => {
  let fixture: ComponentFixture<CertificationsPageComponent>;
  let load: ReturnType<typeof vi.fn>;
  let updateStatus: { execute: ReturnType<typeof vi.fn> };
  const iso = { certificationId: 5, supplierId: 9, certification: 'ISO 14001', issuingBody: 'ABNT', issuedAt: '2026-01-10', expiresAt: '2099-01-10', status: 'ACTIVE' };

  function render(supplierId: number | null = 9): HTMLElement {
    TestBed.configureTestingModule({
      providers: [
        { provide: CertificationsRepository, useValue: { load } },
        { provide: SessionService, useValue: { supplierId: () => supplierId } },
        { provide: CreateCertificationUseCase, useValue: { execute: vi.fn().mockReturnValue(of(iso)) } },
        { provide: UpdateCertificationStatusUseCase, useValue: updateStatus },
      ],
    });
    fixture = TestBed.createComponent(CertificationsPageComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => {
    load = vi.fn().mockReturnValue(of({ items: [iso], totalPages: 2 }));
    updateStatus = { execute: vi.fn().mockReturnValue(of(iso)) };
  });

  it('lists the company certifications with the status menu and the create form', () => {
    const page = render();
    expect(load).toHaveBeenCalledWith({ page: 0, size: 20 });
    expect(page.textContent).toContain('ISO 14001');
    expect(page.querySelector('details.status-menu')).not.toBeNull();
    expect(page.querySelector('app-certification-form')).not.toBeNull();
  });

  it('reloads after a status change', () => {
    render();
    fixture.componentInstance.load();
    expect(load).toHaveBeenCalledTimes(2);
    const list = fixture.debugElement.query((node) => node.name === 'app-certification-list');
    list.triggerEventHandler('updated');
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('goes back to the first page after registering a certification', () => {
    render();
    fixture.componentInstance.changePage(1);
    expect(load).toHaveBeenLastCalledWith({ page: 1, size: 20 });
    const form = fixture.debugElement.query((node) => node.name === 'app-certification-form');
    form.triggerEventHandler('saved');
    expect(load).toHaveBeenLastCalledWith({ page: 0, size: 20 });
  });

  it('pages within the bounds', () => {
    render();
    fixture.componentInstance.changePage(-1);
    fixture.componentInstance.changePage(1);
    fixture.componentInstance.changePage(1);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('shows a retry when the list fails', () => {
    load.mockReturnValue(throwError(() => new Error('500')));
    const page = render();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível carregar as certificações.');
    load.mockReturnValue(of({ items: [iso], totalPages: 1 }));
    page.querySelector<HTMLButtonElement>('.certifications-retry')!.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('ISO 14001');
  });

  it('explains when the supplier of the session is unknown instead of showing the form', () => {
    const page = render(null);
    expect(page.querySelector('app-certification-form')).toBeNull();
    expect(page.textContent).toContain('Não foi possível identificar o fornecedor desta sessão.');
  });
});
