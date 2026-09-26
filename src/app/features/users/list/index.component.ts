import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { UsersService } from '../index.service';
@Component({ selector: 'app-users-list', imports: [RouterLink], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class UserListComponent {
  private readonly service = inject(UsersService); 
  readonly items = signal<Record<string, any>[]>([]); readonly loading = signal(true); readonly error = signal('');
  constructor() { this.reload(); }
  reload(): void { this.loading.set(true); this.service.load().subscribe({ next: (data: any[]) => { this.items.set(data); this.loading.set(false); }, error: () => { this.error.set('Não foi possível carregar os dados. Tente novamente.'); this.loading.set(false); } }); }
  updateRole(id: number, role: string): void { this.service.updateRole(id, role).subscribe({ next: () => this.reload(), error: () => this.error.set('Não foi possível alterar o perfil.') }); }
}
