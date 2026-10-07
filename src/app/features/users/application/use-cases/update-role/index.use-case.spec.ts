import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsersRepository } from '../../../infrastructure/index.repository';
import { UpdateUserRoleUseCase } from './index.use-case';

describe('UpdateUserRoleUseCase', () => {
  it('updates the role of the given user through the repository', () => {
    const repository = { updateRole: vi.fn().mockReturnValue(of({})) };
    TestBed.configureTestingModule({ providers: [{ provide: UsersRepository, useValue: repository }] });
    const user = { userId: 9, name: 'Ana', email: 'ana@example.com', role: 'manager' as const };

    TestBed.inject(UpdateUserRoleUseCase).execute(user, 'auditor').subscribe();

    expect(repository.updateRole).toHaveBeenCalledWith(9, 'auditor');
  });
});
