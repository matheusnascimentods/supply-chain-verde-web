import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { SessionService } from '../../auth/session/index.service';
import { ROLE_LABELS } from '../../auth/session/index.model';
import { NAV_LINKS } from '../navigation/index.constants';
import { CloseOnOutsideClickDirective } from '../../../shared/directives/close-on-outside-click/index.directive';

@Component({
  selector: 'app-top-nav',
  imports: [RouterLink, CloseOnOutsideClickDirective],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavComponent {
  @ViewChild('profileMenu') private profileMenu?: ElementRef<HTMLDetailsElement>;

  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly links = computed(() => {
    const role = this.session.role();
    return role ? NAV_LINKS[role] : [];
  });
  readonly email = this.session.email;
  readonly roleLabel = computed(() => {
    const role = this.session.role();
    return role ? ROLE_LABELS[role] : '';
  });
  readonly isSupplier = computed(() => this.session.role() === 'supplier');
  readonly mobileMenuOpen = signal(false);
  private readonly currentUrl = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.mobileMenuOpen.set(false);
        this.closeProfileMenu();
      });
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

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  logout(): void {
    this.session.logout();
  }

  private closeProfileMenu(): void {
    if (this.profileMenu) this.profileMenu.nativeElement.open = false;
  }

  private normalizedUrl(): string {
    return this.currentUrl().split(/[?#]/, 1)[0];
  }
}
