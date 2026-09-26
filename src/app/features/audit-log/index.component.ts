import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from './index.service';
import { AuditLogResponseDTO } from './index.schema';
@Component({ selector: 'app-audit-log', imports: [DatePipe, FormsModule], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class AuditLogComponent {
  private readonly service = inject(AuditLogService);

  readonly logs = signal<AuditLogResponseDTO[]>([]);
  readonly userId = signal('');
  readonly action = signal('');
  readonly tableAffected = signal('');
  readonly appliedFilters = signal({ userId: '', action: '', tableAffected: '' });
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filteredLogs = computed(() => {
    const filters = this.appliedFilters();
    return this.logs().filter((log) =>
      (!filters.userId || String(log.userId ?? '').includes(filters.userId)) &&
      (!filters.action || log.action === filters.action) &&
      (!filters.tableAffected || (log.affectedTable ?? '').toLocaleLowerCase().includes(filters.tableAffected.toLocaleLowerCase())),
    );
  });

  readonly actions = [
    { value: 'INSERT', label: 'Cadastro' },
    { value: 'UPDATE', label: 'Atualização' },
    { value: 'DELETE', label: 'Exclusão' },
    { value: 'STATUS_CHANGE', label: 'Alteração de status' },
  ];

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.load().subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar os registros de auditoria.');
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.appliedFilters.set({
      userId: this.userId().trim(),
      action: this.action(),
      tableAffected: this.tableAffected().trim(),
    });
  }

  clearFilters(): void {
    this.userId.set('');
    this.action.set('');
    this.tableAffected.set('');
    this.appliedFilters.set({ userId: '', action: '', tableAffected: '' });
  }

  actionLabel(action: string): string {
    return this.actions.find((option) => option.value === action)?.label ?? action;
  }
}
