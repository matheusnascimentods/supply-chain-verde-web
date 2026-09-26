import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CertificationsService } from '../index.service';
@Component({ selector: 'app-certifications-list', imports: [RouterLink], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class CertificationListComponent {
  private readonly service = inject(CertificationsService); 
  readonly items = signal<Record<string, any>[]>([]); readonly loading = signal(true); readonly error = signal(''); readonly expiring = signal(false);
  constructor() { this.reload(); }
  reload(): void { this.loading.set(true); this.service.load(this.expiring()).subscribe({ next: (data: any[]) => { this.items.set(data); this.loading.set(false); }, error: () => { this.error.set('Não foi possível carregar os dados. Tente novamente.'); this.loading.set(false); } }); }
  setStatus(id: number, status: string): void { this.service.updateStatus(id, status).subscribe({ next: () => this.reload(), error: () => this.error.set('Não foi possível atualizar o status.') }); }
}
