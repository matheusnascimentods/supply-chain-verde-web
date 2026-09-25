import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserRole } from '../../core/session/index.schema';
import { SessionService } from '../../core/session/index.service';
import { DASHBOARDS } from './index.constants';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly session = inject(SessionService);

  readonly role = this.session.role;
  readonly roleLabel = computed(() => {
    const role = this.role();
    if (!role) return 'Visitante';

    const labels: Record<UserRole, string> = {
      admin: 'Administrador',
      manager: 'Gestor',
      auditor: 'Auditor',
      supplier: 'Fornecedor',
    };
    return labels[role];
  });
  readonly content = computed(() => {
    const role = this.role();
    return role ? DASHBOARDS[role] : null;
  });
}
