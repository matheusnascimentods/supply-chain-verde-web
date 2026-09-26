import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from './index.service';
import { AuditLogResponseDTO } from './index.schema';
@Component({ selector: 'app-audit-log', imports: [DatePipe, FormsModule], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class AuditLogComponent {
  private readonly service = inject(AuditLogService); readonly logs = signal<AuditLogResponseDTO[]>([]); readonly userId = signal(''); readonly action = signal(''); readonly tableAffected = signal(''); readonly error = signal('');
  constructor() { this.search(); }
  search(): void { this.service.load({ userId: this.userId(), action: this.action(), tableAffected: this.tableAffected() }).subscribe({ next: (logs) => { this.logs.set(logs); this.error.set(''); }, error: () => this.error.set('Não foi possível carregar os registros de auditoria.') }); }
}
