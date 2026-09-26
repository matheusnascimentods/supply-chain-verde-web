import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '../../../core/session/index.service';
import { DASHBOARDS } from '../../../features/dashboard/index.constants';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebarComponent {
  private readonly session = inject(SessionService);
  readonly links = computed(() => {
    const role = this.session.role();
    return role ? DASHBOARDS[role].links : [];
  });
}
