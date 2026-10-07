import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ROLE_LABELS, UserRole } from '../../../../../core/auth/session/index.model';

@Component({
  selector: 'app-role-badge',
  template: '{{ label() }}<ng-content />',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-role]': 'role()' },
})
export class RoleBadgeComponent {
  readonly role = input.required<UserRole>();
  protected readonly label = computed(() => ROLE_LABELS[this.role()]);
}
