import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersListFacade } from '../../../application/index.facade';
import { CreateUserUseCase } from '../../../application/use-cases/create-user/index.use-case';
import { UserListComponent } from './index.component';

describe('UserListComponent', () => {
  let fixture: ComponentFixture<UserListComponent>;
  let facade: Record<string, unknown> & { canManage: ReturnType<typeof signal<boolean>>; canChangeRoles: ReturnType<typeof signal<boolean>>; updateRole: ReturnType<typeof vi.fn>; reloadFromFirstPage: ReturnType<typeof vi.fn> };
  const ana = { userId: 1, name: 'Ana', email: 'ana@example.com', role: 'manager', createdAt: null };
  const bia = { userId: 2, name: 'Bia', email: 'bia@example.com', role: 'supplier', createdAt: null, supplierId: 7, supplierName: 'Fazenda Verde' };

  beforeEach(() => {
    facade = {
      items: signal([ana]),
      loading: signal(false),
      error: signal(''),
      roleError: signal(''),
      email: signal(''),
      totalPages: signal(1),
      pageNumber: signal(1),
      updatingRoleId: signal(null),
      canManage: signal(true),
      canChangeRoles: signal(true),
      reload: vi.fn(),
      searchFor: vi.fn(),
      previousPage: vi.fn(),
      nextPage: vi.fn(),
      updateRole: vi.fn(),
      reloadFromFirstPage: vi.fn(),
    };
    TestBed.configureTestingModule({ providers: [{ provide: CreateUserUseCase, useValue: {} }] });
    TestBed.overrideComponent(UserListComponent, { set: { providers: [{ provide: UsersListFacade, useValue: facade }] } });
    fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();
  });

  it('renders the users with an editable role menu for administrators', () => {
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('Ana');
    expect(page.querySelector('app-role-menu')).not.toBeNull();
    expect(page.textContent).toContain('+ Adicionar usuário');
  });

  it('shows only the role badge for users who cannot change roles', () => {
    facade.canChangeRoles.set(false);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('app-role-menu')).toBeNull();
    expect(page.querySelector('app-role-badge')?.textContent?.trim()).toBe('Gestor');
  });

  it('shows the linked supplier of each user', () => {
    (facade['items'] as ReturnType<typeof signal<unknown[]>>).set([ana, bia]);
    fixture.detectChanges();
    const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr'));
    expect(rows[0].textContent).toContain('—');
    expect(rows[1].textContent).toContain('Fazenda Verde');
  });

  it('forwards the selected role to the facade', () => {
    const page: HTMLElement = fixture.nativeElement;
    page.querySelector<HTMLButtonElement>('[role="menuitemradio"][aria-checked="false"]')!.click();
    expect(facade.updateRole).toHaveBeenCalledWith(ana, 'admin');
  });

  it('closes the modal and reloads from the first page after a user is created', () => {
    fixture.componentInstance.createModalOpen.set(true);
    fixture.componentInstance.userCreated();
    expect(fixture.componentInstance.createModalOpen()).toBe(false);
    expect(facade.reloadFromFirstPage).toHaveBeenCalled();
  });
});
