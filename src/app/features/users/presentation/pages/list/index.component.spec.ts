import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersListFacade } from '../../../application/index.facade';
import { SendInviteUseCase } from '../../../application/use-cases/send-invite/index.use-case';
import { ErrorToastService } from '../../../../../shared/ui/error-toast/index.service';
import { UserListComponent } from './index.component';

describe('UserListComponent', () => {
  let fixture: ComponentFixture<UserListComponent>;
  let toast: ErrorToastService;
  let facade: Record<string, unknown> & { canCreate: ReturnType<typeof signal<boolean>>; showCompany: ReturnType<typeof signal<boolean>>; canChangeRoles: ReturnType<typeof signal<boolean>>; updateRole: ReturnType<typeof vi.fn> };
  const ana = { userId: 1, name: 'Ana', email: 'ana@example.com', role: 'manager', active: true, createdAt: null, companyType: 'market', companyName: 'Mercado Bom Preço' };
  const root = { userId: 3, name: 'Root', email: 'root@example.com', role: 'platform_admin', active: true, createdAt: null, companyType: null, companyName: null };

  beforeEach(() => {
    facade = {
      items: signal([ana]),
      loading: signal(false),
      error: signal(''),
      email: signal(''),
      totalPages: signal(1),
      pageNumber: signal(1),
      updatingRoleId: signal(null),
      updatingStatusId: signal(null),
      roles: signal([]),
      active: signal(null),
      filterRoles: signal(['admin', 'manager', 'auditor']),
      toggleRole: vi.fn(),
      setActive: vi.fn(),
      canToggleStatus: vi.fn((user: { email: string; companyType: string | null }) => !!user.companyType && user.email !== 'boss@example.com'),
      toggleStatus: vi.fn(),
      seats: signal({ used: 8, max: 10 }),
      seatsFull: signal(false),
      loadSeats: vi.fn(),
      canCreate: signal(true),
      showCompany: signal(false),
      canChangeRoles: signal(true),
      reload: vi.fn(),
      searchFor: vi.fn(),
      previousPage: vi.fn(),
      nextPage: vi.fn(),
      updateRole: vi.fn(),
    };
    TestBed.configureTestingModule({ providers: [{ provide: SendInviteUseCase, useValue: {} }] });
    TestBed.overrideComponent(UserListComponent, { set: { providers: [{ provide: UsersListFacade, useValue: facade }] } });
    fixture = TestBed.createComponent(UserListComponent);
    toast = TestBed.inject(ErrorToastService);
    fixture.detectChanges();
  });

  it('renders the users with an editable role menu for administrators', () => {
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('Ana');
    expect(page.querySelector('app-role-menu')).not.toBeNull();
    expect(page.textContent).toContain('+ Convidar usuário');
  });

  it('is read-only for users who cannot manage: no create button and no role menu', () => {
    facade.canCreate.set(false);
    facade.canChangeRoles.set(false);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).not.toContain('+ Convidar usuário');
    expect(page.querySelector('app-role-menu')).toBeNull();
    expect(page.querySelector('app-role-badge')?.textContent?.trim()).toBe('Gestor');
  });

  it('has no supplier column and shows "Empresa" only to the platform admin', () => {
    const headers = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers()).not.toContain('Fornecedor');
    expect(headers()).not.toContain('Empresa');

    facade.showCompany.set(true);
    (facade['items'] as ReturnType<typeof signal<unknown[]>>).set([ana, root]);
    fixture.detectChanges();
    expect(headers()).toContain('Empresa');
    const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr'));
    expect(rows[0].textContent).toContain('Mercado Bom Preço');
    expect(rows[1].textContent).toContain('Plataforma');
    expect(rows[1].querySelector('app-role-menu')).toBeNull();
  });

  it('forwards the selected role to the facade', () => {
    const page: HTMLElement = fixture.nativeElement;
    page.querySelector<HTMLButtonElement>('[role="menuitemradio"][aria-checked="false"]')!.click();
    expect(facade.updateRole).toHaveBeenCalledWith(ana, 'admin');
  });

  it('opens the invite modal from the button', () => {
    const page: HTMLElement = fixture.nativeElement;
    Array.from(page.querySelectorAll('button')).find((button) => button.textContent?.includes('Convidar usuário'))!.click();
    fixture.detectChanges();
    expect(page.querySelector('app-invite-user-modal')).not.toBeNull();
  });

  it('closes the modal and shows a toast after an invite, reloading only the seats', () => {
    fixture.componentInstance.inviteModalOpen.set(true);
    fixture.componentInstance.userInvited('ana@example.com');
    expect(fixture.componentInstance.inviteModalOpen()).toBe(false);
    expect(toast.toasts().map(({ message, variant }) => ({ message, variant }))).toEqual([{ message: 'Convite enviado para ana@example.com.', variant: 'success' }]);
    expect(facade['reload']).not.toHaveBeenCalled();
    expect(facade['loadSeats']).toHaveBeenCalled();
    toast.clear();
  });

  const inviteButton = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((button) => button.textContent?.includes('Convidar usuário'))!;
  const counter = () => (fixture.nativeElement as HTMLElement).querySelector('[data-testid="seats-counter"]');

  it('shows the seats counter next to the invite button', () => {
    expect(counter()?.textContent?.trim()).toBe('8 de 10 assentos em uso');
    expect(inviteButton().disabled).toBe(false);
  });

  it('disables the invite with an explanation when the seats are full', () => {
    (facade['seats'] as ReturnType<typeof signal<unknown>>).set({ used: 10, max: 10 });
    (facade['seatsFull'] as ReturnType<typeof signal<boolean>>).set(true);
    fixture.detectChanges();
    expect(counter()?.textContent?.trim()).toBe('10 de 10 assentos em uso');
    expect(inviteButton().disabled).toBe(true);
    expect(inviteButton().getAttribute('title')).toBe('Sem assentos livres');
  });

  it('hides the counter when the seats are not loaded', () => {
    (facade['seats'] as ReturnType<typeof signal<unknown>>).set(null);
    fixture.detectChanges();
    expect(counter()).toBeNull();
  });

  describe('status column', () => {
    const items = () => facade['items'] as ReturnType<typeof signal<unknown[]>>;
    const row = (index: number) => (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr')[index] as HTMLElement;
    const toggle = (index: number) => row(index).querySelector<HTMLButtonElement>('[data-testid="toggle-status"]');

    it('shows the status as a single colored toggle that deactivates on click', () => {
      expect(row(0).querySelectorAll('.users-status').length).toBe(1);
      expect(toggle(0)?.textContent?.trim()).toBe('Ativo');
      expect(toggle(0)?.getAttribute('data-status')).toBe('active');
      expect(toggle(0)?.getAttribute('aria-label')).toBe('Ativo, desativar Ana');
      expect(toggle(0)?.getAttribute('title')).toBe('Clique para desativar');
      toggle(0)!.click();
      expect(facade['toggleStatus']).toHaveBeenCalledWith(ana);
    });

    it('shows a read-only status on the own row and on a user without company', () => {
      items().set([{ ...ana, email: 'boss@example.com' }, root]);
      fixture.detectChanges();
      expect(toggle(0)).toBeNull();
      expect(toggle(1)).toBeNull();
      expect(row(0).querySelector('span.users-status')?.textContent?.trim()).toBe('Ativo');
    });

    it('marks an inactive user, locks its role menu and reactivates from the toggle', () => {
      items().set([{ ...ana, active: false }]);
      fixture.detectChanges();
      expect(row(0).classList).toContain('users-row-inactive');
      expect(row(0).querySelector<HTMLButtonElement>('app-role-menu button')?.disabled).toBe(true);
      expect(toggle(0)?.textContent?.trim()).toBe('Inativo');
      expect(toggle(0)?.getAttribute('data-status')).toBe('inactive');
      expect(toggle(0)?.getAttribute('aria-label')).toBe('Inativo, reativar Ana');
      expect(toggle(0)?.disabled).toBe(false);
    });

    it('disables the reactivation with an explanation when the seats are full, but keeps the deactivation', () => {
      items().set([{ ...ana, active: false }, { ...ana, userId: 2, active: true }]);
      (facade['seatsFull'] as ReturnType<typeof signal<boolean>>).set(true);
      fixture.detectChanges();
      expect(toggle(0)?.disabled).toBe(true);
      expect(toggle(0)?.getAttribute('title')).toBe('Sem assentos livres');
      expect(toggle(1)?.disabled).toBe(false);
    });
  });

  describe('filters', () => {
    const buttons = (testId: string) => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(`[data-testid="${testId}"]`));
    const pressed = (testId: string) => buttons(testId).filter((button) => button.getAttribute('aria-pressed') === 'true').map((button) => button.textContent?.trim());

    it('shows the role badges of the company and "Todos" pressed by default', () => {
      expect(buttons('role-filter').map((button) => button.textContent?.trim())).toEqual(['Administrador', 'Gestor', 'Auditor']);
      expect(pressed('role-filter')).toEqual([]);
      expect(pressed('status-filter')).toEqual(['Todos']);
    });

    it('presses several roles and one status at a time', () => {
      (facade['roles'] as ReturnType<typeof signal<string[]>>).set(['manager', 'auditor']);
      (facade['active'] as ReturnType<typeof signal<boolean | null>>).set(false);
      fixture.detectChanges();
      expect(pressed('role-filter')).toEqual(['Gestor', 'Auditor']);
      expect(pressed('status-filter')).toEqual(['Inativos']);
    });

    it('forwards the clicks to the facade', () => {
      buttons('role-filter')[1].click();
      buttons('status-filter')[2].click();
      buttons('status-filter')[0].click();
      expect(facade['toggleRole']).toHaveBeenCalledWith('manager');
      expect(facade['setActive']).toHaveBeenCalledWith(false);
      expect(facade['setActive']).toHaveBeenLastCalledWith(null);
    });

    it('hides the role group when there are no roles to filter', () => {
      (facade['filterRoles'] as ReturnType<typeof signal<string[]>>).set([]);
      fixture.detectChanges();
      expect(buttons('role-filter')).toEqual([]);
      expect(buttons('status-filter').length).toBe(3);
    });
  });
});
