import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { ROLE_LABELS, USER_ROLES, UserRole } from '../../../../../core/auth/session/index.model';
import { CloseOnOutsideClickDirective } from '../../../../../shared/directives/close-on-outside-click/index.directive';
import { User } from '../../../domain/index.model';
import { RoleBadgeComponent } from '../role-badge/index.component';

const MENU_HEIGHT = 176;
const MENU_WIDTH = 192;

@Component({
  selector: 'app-role-menu',
  imports: [RoleBadgeComponent, CloseOnOutsideClickDirective],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleMenuComponent {
  readonly user = input.required<User>();
  readonly disabled = input(false);
  readonly roleSelected = output<UserRole>();

  protected readonly roles = USER_ROLES;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly position = signal({ top: 0, left: 0 });

  protected select(role: UserRole, menu: HTMLDetailsElement): void {
    menu.open = false;
    if (role !== this.user().role) this.roleSelected.emit(role);
  }

  protected positionMenu(event: Event): void {
    const menu = event.currentTarget as HTMLDetailsElement;
    const summary = menu.querySelector('summary');
    if (!menu.open || !summary) return;
    const bounds = summary.getBoundingClientRect();
    const placeBelow = window.innerHeight - bounds.bottom >= MENU_HEIGHT + 12;
    const top = placeBelow ? bounds.bottom + 8 : Math.max(8, bounds.top - MENU_HEIGHT - 8);
    const left = Math.max(8, Math.min(bounds.left, window.innerWidth - MENU_WIDTH - 8));
    this.position.set({ top, left });
  }

  protected onKeydown(event: KeyboardEvent, menu: HTMLDetailsElement): void {
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
