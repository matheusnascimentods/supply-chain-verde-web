import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { SessionService } from '../../../core/session/index.service';
import { UserRole } from '../../../core/session/index.schema';
import { AuthService } from '../../../features/auth/index.service';
import { DASHBOARDS } from '../../../features/dashboard/index.constants';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  auditor: 'Auditor',
  supplier: 'Fornecedor',
};

@Component({
  selector: 'app-top-nav',
  imports: [RouterLink],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavComponent {
  @ViewChild('profileMenu') private profileMenu?: ElementRef<HTMLDetailsElement>;

  private readonly session = inject(SessionService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly links = computed(() => {
    const role = this.session.role();
    return role ? DASHBOARDS[role].links : [];
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

  @HostListener('document:click', ['$event'])
  closeProfileMenuOnOutsideClick(event: MouseEvent): void {
    const menu = this.profileMenu?.nativeElement;
    if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) {
      this.closeProfileMenu();
    }
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
    this.auth.logout();
  }

  private closeProfileMenu(): void {
    if (this.profileMenu) this.profileMenu.nativeElement.open = false;
  }

  private normalizedUrl(): string {
    return this.currentUrl().split(/[?#]/, 1)[0];
  }
}
