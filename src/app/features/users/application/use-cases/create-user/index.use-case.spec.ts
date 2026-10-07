import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsersRepository } from '../../../infrastructure/index.repository';
import { CreateUserUseCase } from './index.use-case';

describe('CreateUserUseCase', () => {
  it('creates the user through the repository', () => {
    const created = { userId: 1, name: 'Ana', email: 'ana@example.com', role: 'manager' as const };
    const repository = { create: vi.fn().mockReturnValue(of(created)) };
    TestBed.configureTestingModule({ providers: [{ provide: UsersRepository, useValue: repository }] });
    const input = { name: 'Ana', email: 'ana@example.com', password: 'secret', role: 'manager' as const };

    let result: unknown;
    TestBed.inject(CreateUserUseCase).execute(input).subscribe((user) => (result = user));

    expect(repository.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(created);
  });
});
