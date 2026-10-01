import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from './index.service';
import { AuditLogResponseDTO } from './index.schema';

@Component({
  selector: 'app-audit-log',
  imports: [DatePipe, FormsModule],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogComponent {
  private readonly service = inject(AuditLogService);
  @ViewChild('exportTrigger') private exportTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('exportDialog') private exportDialog?: ElementRef<HTMLElement>;
  @ViewChild('exportStartInput') private exportStartInput?: ElementRef<HTMLInputElement>;
  readonly logs = signal<AuditLogResponseDTO[]>([]);
  readonly action = signal('');
  readonly email = signal('');
  readonly startDate = signal(this.dateDaysAgo(6));
  readonly endDate = signal(this.dateDaysAgo(0));
  readonly pageOffset = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filterError = signal('');
  readonly exportOpen = signal(false);
  readonly exportStartDate = signal(this.dateDaysAgo(6));
  readonly exportEndDate = signal(this.dateDaysAgo(0));
  readonly exportAction = signal('');
  readonly exportEmail = signal('');
  readonly exporting = signal(false);
  readonly exportError = signal('');
  readonly exportUrl = signal('');
  readonly exportFilename = signal('');

  readonly actions = [
    { value: 'INSERT', label: 'Cadastro' },
    { value: 'UPDATE', label: 'Atualização' },
    { value: 'DELETE', label: 'Exclusão' },
    { value: 'STATUS_CHANGE', label: 'Alteração de status' },
  ];

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.load({
      startDate: this.startDate(), endDate: this.endDate(),
      action: this.action(), email: this.email(), offset: this.pageOffset(),
    }).subscribe({
      next: (page) => {
        this.logs.set(page.content);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('[Auditoria] Erro ao carregar registros de auditoria:', error);
        this.error.set('Não foi possível carregar os registros de auditoria.');
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    if (this.startDate() > this.endDate()) {
      this.filterError.set('A data inicial deve ser anterior ou igual à data final.');
      return;
    }
    this.filterError.set('');
    this.pageOffset.set(0);
    this.load();
  }
  previousPage(): void { if (this.pageNumber() > 1 && !this.loading()) { this.pageOffset.update((offset) => Math.max(0, offset - 20)); this.load(); } }
  nextPage(): void { if (this.pageNumber() < this.totalPages() && !this.loading()) { this.pageOffset.update((offset) => offset + 20); this.load(); } }
  actionLabel(value: string): string { return this.actions.find((option) => option.value === value)?.label ?? value; }
  userEmail(log: AuditLogResponseDTO): string | null { return log.userEmail ?? log.email ?? null; }
  detailsLabel(log: AuditLogResponseDTO): string {
    const entity = this.entityLabel(log.affectedTable);
    const identity = log.affectedEntityId == null ? entity : `${entity} #${log.affectedEntityId}`;
    const before = log.beforeData ?? {};
    const after = log.afterData ?? {};
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
    const changes = keys.flatMap((key) => {
      const hasBefore = Object.hasOwn(before, key);
      const hasAfter = Object.hasOwn(after, key);
      if (hasBefore && hasAfter && JSON.stringify(before[key]) === JSON.stringify(after[key])) return [];
      const field = this.fieldLabel(key);
      if (log.action === 'INSERT') return hasAfter ? [`${field}: ${this.valueLabel(after[key])}`] : [];
      if (log.action === 'DELETE') return hasBefore ? [`${field}: ${this.valueLabel(before[key])}`] : [];
      if (hasBefore && hasAfter) return [`${field}: ${this.valueLabel(before[key])} → ${this.valueLabel(after[key])}`];
      return hasAfter ? [`${field}: ${this.valueLabel(after[key])}`] : [`${field}: ${this.valueLabel(before[key])}`];
    });
    const heading = log.action === 'INSERT' ? `${identity} cadastrado` : log.action === 'DELETE' ? `${identity} removido` : identity;
    return changes.length ? `${heading} — ${changes.join('; ')}` : log.affectedEntityId == null ? 'Detalhes indisponíveis' : heading;
  }
  private entityLabel(table?: string | null): string { return ({ suppliers: 'Fornecedor', supplier: 'Fornecedor', users: 'Usuário', user: 'Usuário', products: 'Produto', product: 'Produto', batch: 'Lote', batches: 'Lote', chain: 'Etapa', certification: 'Certificação', report: 'Relatório', transport: 'Transporte', address: 'Endereço', carbon_emission: 'Emissão' } as Record<string, string>)[table ?? ''] ?? 'Registro'; }
  private fieldLabel(field: string): string { const labels: Record<string, string> = { name: 'Nome', cnpj: 'CNPJ', email: 'Email', role: 'Perfil', status: 'Status', quantity: 'Quantidade', producedAt: 'Data de produção', certification: 'Certificação', issuingBody: 'Órgão emissor', phone: 'Telefone', description: 'Descrição', stageType: 'Etapa' }; return labels[field] ?? field.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase()); }
  private valueLabel(value: unknown): string { if (value == null) return 'vazio'; if (typeof value === 'object') return Object.values(value as Record<string, unknown>).join(', '); return String(value); }
  pageNumber(): number { return this.totalPages() === 0 ? 0 : Math.min(Math.floor(this.pageOffset() / 20) + 1, this.totalPages()); }
  actionClass(value: string): string {
    const classes: Record<string, string> = {
      INSERT: 'bg-emerald-50 text-emerald-700', UPDATE: 'bg-blue-50 text-blue-700',
      DELETE: 'bg-red-50 text-red-700', STATUS_CHANGE: 'bg-amber-50 text-amber-800',
    };
    return classes[value] ?? 'bg-slate-100 text-slate-700';
  }

  openExport(): void {
    this.clearPreparedExport();
    this.exportStartDate.set(this.startDate());
    this.exportEndDate.set(this.endDate());
    this.exportAction.set(this.action());
    this.exportEmail.set(this.email());
    this.exportError.set('');
    this.exportOpen.set(true);
    setTimeout(() => this.exportStartInput?.nativeElement.focus());
  }
  closeExport(): void {
    if (!this.exporting()) {
      this.exportOpen.set(false);
      this.clearPreparedExport();
      setTimeout(() => this.exportTrigger?.nativeElement.focus());
    }
  }

  exportLogs(): void {
    if (!this.exportStartDate() || !this.exportEndDate() || this.exportStartDate() > this.exportEndDate()) {
      this.exportError.set('Informe um intervalo de datas válido.');
      console.warn('[Auditoria CSV] Preparação cancelada: intervalo de datas inválido.', {
        startDate: this.exportStartDate(),
        endDate: this.exportEndDate(),
      });
      return;
    }
    console.info('[Auditoria CSV] Preparação iniciada.', {
      startDate: this.exportStartDate(),
      endDate: this.exportEndDate(),
      action: this.exportAction() || 'todas',
      emailFilterApplied: Boolean(this.exportEmail().trim()),
    });
    this.exporting.set(true);
    this.exportError.set('');
    this.service.loadAll({
      startDate: this.exportStartDate(), endDate: this.exportEndDate(),
      action: this.exportAction(), email: this.exportEmail(),
    }).subscribe({
      next: (logs) => {
        console.info('[Auditoria CSV] Registros carregados.', { count: logs.length });
        const columns = ['Email do usuário', 'Operação', 'Data e hora', 'Tabela afetada', 'Detalhes'];
        const rows = logs.map((log) => [log.userEmail ?? log.email ?? '', log.action, log.performedAt, log.affectedTable ?? '', this.detailsLabel(log)]);
        const csv = [columns, ...rows].map((row) => row.map((value) => this.csvCell(value)).join(',')).join('\r\n');
        const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        console.info('[Auditoria CSV] Arquivo preparado.', {
          filename: `audit-logs-${this.exportStartDate()}-${this.exportEndDate()}.csv`,
          bytes: blob.size,
          records: logs.length,
        });
        this.exportUrl.set(url);
        this.exportFilename.set(`audit-logs-${this.exportStartDate()}-${this.exportEndDate()}.csv`);
        this.exporting.set(false);
      },
      error: (error: unknown) => {
        console.error('[Auditoria] Erro ao exportar registros de auditoria:', error);
        this.exportError.set('Falha ao buscar os registros para exportação. Tente novamente.');
        this.exporting.set(false);
      },
    });
  }

  logCsvDownloadClick(): void {
    console.info('[Auditoria CSV] Link nativo de download clicado.', {
      filename: this.exportFilename(),
      urlAvailable: Boolean(this.exportUrl()),
    });
  }

  clearPreparedExport(): void {
    const url = this.exportUrl();
    if (url) URL.revokeObjectURL(url);
    this.exportUrl.set('');
    this.exportFilename.set('');
  }

  onExportKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') { this.closeExport(); return; }
    if (event.key !== 'Tab' || !this.exportDialog) return;
    const focusable = Array.from(this.exportDialog.nativeElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]',
    ));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  }

  private csvCell(value: unknown): string {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value) ?? String(value);
    return `"${serialized.replaceAll('"', '""')}"`;
  }
  private dateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 10);
  }
}
