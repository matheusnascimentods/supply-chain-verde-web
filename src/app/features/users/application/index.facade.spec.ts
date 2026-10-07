import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserRole } from '../../../core/auth/session/index.model';
import { SessionService } from '../../../core/auth/session/index.service';
import { UsersRepository } from '../infrastructure/index.repository';
import { UpdateUserRoleUseCase } from './use-cases/update-role/index.use-case';
import { UsersListFacade } from './index.facade';

describe('UsersListFacade', () => {
  const ana = { userId: 1, name: 'Ana', email: 'ana@example.com', role: 'manager' as UserRole };
  let repository: { load: ReturnType<typeof vi.fn> };
  let updateRole: { execute: ReturnType<typeof vi.fn> };
  const role = signal<UserRole | null>('admin');

  function createFacade(): UsersListFacade {
    TestBed.configureTestingModule({
      providers: [
        UsersListFacade,
        { provide: UsersRepository, useValue: repository },
        { provide: UpdateUserRoleUseCase, useValue: updateRole },
        { provide: SessionService, useValue: { role } },
      ],
    });
    return TestBed.inject(UsersListFacade);
  }

  beforeEach(() => {
    role.set('admin');
    repository = { load: vi.fn().mockReturnValue(of({ items: [ana], totalPages: 3 })) };
    updateRole = { execute: vi.fn().mockReturnValue(of(ana)) };
  });

  afterEach(() => vi.useRealTimers());

  it('loads the first page on creation', () => {
    const facade = createFacade();
    expect(repository.load).toHaveBeenCalledWith({ limit: 20, offset: 0, email: '' });
    expect(facade.items()).toEqual([ana]);
    expect(facade.loading()).toBe(false);
    expect(facade.pageNumber()).toBe(1);
  });

  it('shows an error message when loading fails', () => {
    repository.load.mockReturnValue(throwError(() => new Error('500')));
    const facade = createFacade();
    expect(facade.error()).toBe('Não foi possível carregar os usuários. Tente novamente.');
    expect(facade.loading()).toBe(false);
  });

  it('navigates between pages within the bounds', () => {
    const facade = createFacade();
    facade.previousPage();
    expect(repository.load).toHaveBeenCalledTimes(1);

    facade.nextPage();
    expect(repository.load).toHaveBeenLastCalledWith({ limit: 20, offset: 20, email: '' });
    expect(facade.pageNumber()).toBe(2);

    facade.reloadFromFirstPage();
    expect(repository.load).toHaveBeenLastCalledWith({ limit: 20, offset: 0, email: '' });
  });

  it('debounces the e-mail search and restarts from the first page', () => {
    vi.useFakeTimers();
    const facade = createFacade();
    facade.nextPage();

    facade.searchFor('ana');
    expect(repository.load).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(300);

    expect(repository.load).toHaveBeenLastCalledWith({ limit: 20, offset: 0, email: 'ana' });
  });

  it('updates the role and reloads the list', () => {
    const facade = createFacade();
    facade.updateRole(ana, 'auditor');
    expect(updateRole.execute).toHaveBeenCalledWith(ana, 'auditor');
    expect(repository.load).toHaveBeenCalledTimes(2);
    expect(facade.updatingRoleId()).toBeNull();
  });

  it('ignores updates to the same role or by users who cannot manage', () => {
    const facade = createFacade();
    facade.updateRole(ana, 'manager');
    role.set('manager');
    facade.updateRole(ana, 'auditor');
    expect(updateRole.execute).not.toHaveBeenCalled();
  });

  it('shows an error when the role update fails', () => {
    updateRole.execute.mockReturnValue(throwError(() => new Error('500')));
    const facade = createFacade();
    facade.updateRole(ana, 'auditor');
    expect(facade.roleError()).toBe('Não foi possível alterar o perfil de Ana.');
    expect(facade.updatingRoleId()).toBeNull();
  });
});
