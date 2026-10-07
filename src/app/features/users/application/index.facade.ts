import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserRole } from '../../../core/auth/session/index.model';
import { SessionService } from '../../../core/auth/session/index.service';
import { User } from '../domain/index.model';
import { canManageUsers } from '../domain/index.rules';
import { UsersRepository } from '../infrastructure/index.repository';
import { UpdateUserRoleUseCase } from './use-cases/update-role/index.use-case';

const PAGE_SIZE = 20;

@Injectable()
export class UsersListFacade {
  private readonly repository = inject(UsersRepository);
  private readonly updateUserRole = inject(UpdateUserRoleUseCase);
  private readonly session = inject(SessionService);
  private readonly emailChanges = new Subject<string>();
  private readonly offset = signal(0);
  private loadSequence = 0;

  readonly items = signal<User[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly roleError = signal('');
  readonly email = signal('');
  readonly totalPages = signal(0);
  readonly updatingRoleId = signal<number | null>(null);
  readonly canManage = computed(() => canManageUsers(this.session.role()));
  readonly pageNumber = computed(() =>
    this.totalPages() === 0 ? 0 : Math.min(Math.floor(this.offset() / PAGE_SIZE) + 1, this.totalPages()),
  );

  constructor() {
    this.emailChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.reload());
    this.reload();
  }

  reload(): void {
    const sequence = ++this.loadSequence;
    this.loading.set(true);
    this.error.set('');
    this.repository.load({ limit: PAGE_SIZE, offset: this.offset(), email: this.email() }).subscribe({
      next: (page) => {
        if (sequence !== this.loadSequence) return;
        this.items.set(page.items);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => {
        if (sequence !== this.loadSequence) return;
        this.error.set('Não foi possível carregar os usuários. Tente novamente.');
        this.loading.set(false);
      },
    });
  }

  searchFor(value: string): void {
    this.email.set(value);
    this.offset.set(0);
    this.emailChanges.next(value.trim());
  }

  previousPage(): void {
    if (this.pageNumber() <= 1 || this.loading()) return;
    this.offset.update((offset) => Math.max(0, offset - PAGE_SIZE));
    this.reload();
  }

  nextPage(): void {
    if (this.pageNumber() >= this.totalPages() || this.loading()) return;
    this.offset.update((offset) => offset + PAGE_SIZE);
    this.reload();
  }

  reloadFromFirstPage(): void {
    this.offset.set(0);
    this.reload();
  }

  updateRole(user: User, role: UserRole): void {
    if (!this.canManage() || user.role === role) return;
    this.roleError.set('');
    this.updatingRoleId.set(user.userId);
    this.updateUserRole.execute(user, role).subscribe({
      next: () => {
        this.updatingRoleId.set(null);
        this.reload();
      },
      error: () => {
        this.updatingRoleId.set(null);
        this.roleError.set(`Não foi possível alterar o perfil de ${user.name}.`);
      },
    });
  }
}
