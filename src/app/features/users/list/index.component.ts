import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { SessionService } from '../../../core/auth/session/index.service';
import { USER_ROLES, UserResponseDTO, UserRole } from '../index.schema';
import { UsersService } from '../index.service';
import { UserFormComponent } from '../form/index.component';
import { ButtonComponent } from '../../../shared/ui/button/index.component';
import { DataTableComponent } from '../../../shared/ui/data-table/index.component';
import { ModalComponent } from '../../../shared/ui/modal/index.component';
import { PaginationComponent } from '../../../shared/ui/pagination/index.component';
import { TextFieldComponent } from '../../../shared/ui/text-field/index.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-users-list',
  imports: [DatePipe, FormsModule, UserFormComponent, ButtonComponent, DataTableComponent, ModalComponent, PaginationComponent, TextFieldComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'closeRoleMenusOnOutsideClick($event)' },
})
export class UserListComponent {
  private readonly service = inject(UsersService);
  private readonly session = inject(SessionService);
  private readonly emailChanges = new Subject<string>();
  private loadSequence = 0;

  @ViewChildren('roleMenu') private roleMenus?: QueryList<ElementRef<HTMLDetailsElement>>;

  readonly items = signal<UserResponseDTO[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly roleError = signal('');
  readonly email = signal('');
  readonly offset = signal(0);
  readonly totalPages = signal(0);
  readonly createModalOpen = signal(false);
  readonly updatingRoleId = signal<number | null>(null);
  readonly roleMenuPosition = signal({ top: 0, left: 0 });
  readonly roles = USER_ROLES;
  readonly canManage = () => this.session.role() === 'admin';

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
    this.service.load({ limit: PAGE_SIZE, offset: this.offset(), email: this.email() }).subscribe({
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

  pageNumber(): number {
    return this.totalPages() === 0 ? 0 : Math.min(Math.floor(this.offset() / PAGE_SIZE) + 1, this.totalPages());
  }

  openCreateModal(): void {
    this.createModalOpen.set(true);
  }

  dismissCreateModal(): void {
    this.createModalOpen.set(false);
  }

  userCreated(): void {
    this.createModalOpen.set(false);
    this.offset.set(0);
    this.reload();
  }

  updateRole(user: UserResponseDTO, role: UserRole, menu: HTMLDetailsElement): void {
    menu.open = false;
    if (!this.canManage() || user.role === role) return;
    this.roleError.set('');
    this.updatingRoleId.set(user.userId);
    this.service.updateRole(user.userId, role).subscribe({
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

  roleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      admin: 'Administrador', manager: 'Gestor', auditor: 'Auditor', supplier: 'Fornecedor',
    };
    return labels[role];
  }

  roleStyle(role: UserRole): string {
    const styles: Record<UserRole, string> = {
      admin: 'bg-violet-50 text-violet-700 ring-violet-600/20',
      manager: 'bg-blue-50 text-blue-700 ring-blue-600/20',
      auditor: 'bg-amber-50 text-amber-800 ring-amber-600/20',
      supplier: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    };
    return styles[role];
  }

  closeRoleMenusOnOutsideClick(event: MouseEvent): void {
    const target = event.target as Node;
    this.roleMenus?.forEach(({ nativeElement: menu }) => {
      if (!menu.contains(target)) menu.open = false;
    });
  }

  positionRoleMenu(event: Event): void {
    const menu = event.currentTarget as HTMLDetailsElement;
    if (!menu.open) return;

    const summary = menu.querySelector('summary');
    if (!summary) return;
    const bounds = summary.getBoundingClientRect();
    const menuHeight = 176;
    const menuWidth = 192;
    const placeBelow = window.innerHeight - bounds.bottom >= menuHeight + 12;
    const top = placeBelow ? bounds.bottom + 8 : Math.max(8, bounds.top - menuHeight - 8);
    const left = Math.max(8, Math.min(bounds.left, window.innerWidth - menuWidth - 8));
    this.roleMenuPosition.set({ top, left });
  }

  onRoleMenuKeydown(event: KeyboardEvent, menu: HTMLDetailsElement): void {
    if (!menu.open) return;
    const options = Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
    if (event.key === 'Escape') {
      event.preventDefault();
      menu.open = false;
      menu.querySelector('summary')?.focus();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const currentIndex = options.indexOf(event.target as HTMLButtonElement);
      const nextIndex = currentIndex < 0
        ? event.key === 'ArrowUp' ? options.length - 1 : 0
        : event.key === 'Home' ? 0
          : event.key === 'End' ? options.length - 1
            : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[nextIndex]?.focus();
    }
  }

}
