import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsersRepository } from '../../../infrastructure/index.repository';
import { SendInviteUseCase } from './index.use-case';

describe('SendInviteUseCase', () => {
  it('sends the invite through the repository', () => {
    const repository = { invite: vi.fn().mockReturnValue(of(undefined)) };
    TestBed.configureTestingModule({ providers: [{ provide: UsersRepository, useValue: repository }] });
    const input = { email: 'ana@example.com', role: 'manager' as const };

    let done = false;
    TestBed.inject(SendInviteUseCase).execute(input).subscribe(() => (done = true));

    expect(repository.invite).toHaveBeenCalledWith(input);
    expect(done).toBe(true);
  });
});
