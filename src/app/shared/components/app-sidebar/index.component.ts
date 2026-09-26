import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { SessionService } from '../../../core/session/index.service';
import { DASHBOARDS } from '../../../features/dashboard/index.constants';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebarComponent {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  readonly links = computed(() => {
    const role = this.session.role();
    return role ? DASHBOARDS[role].links : [];
  });
  private readonly currentUrl = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
  }

  isDashboardActive(): boolean {
    return this.normalizedUrl() === '/dashboard';
  }

  isLinkActive(path: string): boolean {
    const url = this.normalizedUrl();
    const activePath = this.links()
      .map((link) => link.path)
      .filter((linkPath) => url === linkPath || url.startsWith(`${linkPath}/`))
      .sort((left, right) => right.length - left.length)[0];

    return activePath === path;
  }

  private normalizedUrl(): string {
    return this.currentUrl().split(/[?#]/, 1)[0];
  }
}
