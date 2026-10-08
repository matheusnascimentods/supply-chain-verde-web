import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { ExportAuditLogsUseCase } from '../../../application/use-cases/export-csv/index.use-case';
import { AUDIT_ACTIONS, AUDIT_ACTION_LABELS, AuditAction, AuditLogFilters } from '../../../domain/index.model';
import { isValidPeriod } from '../../../domain/index.rules';

@Component({
  selector: 'app-audit-export-modal',
  imports: [FormsModule, ButtonComponent, ModalComponent, TextFieldComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditExportModalComponent implements OnInit {
  private readonly exportLogs = inject(ExportAuditLogsUseCase);
  protected readonly actions = AUDIT_ACTIONS;
  protected readonly actionLabels = AUDIT_ACTION_LABELS;

  /** Filtros da tela, usados como ponto de partida da exportação. */
  readonly initialFilters = input.required<AuditLogFilters>();
  readonly closed = output<void>();

  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly action = signal<AuditAction | ''>('');
  readonly email = signal('');
  readonly exporting = signal(false);
  readonly error = signal('');
  readonly fileUrl = signal('');
  readonly filename = signal('');

  constructor() {
    inject(DestroyRef).onDestroy(() => this.discardFile());
  }

  ngOnInit(): void {
    const { startDate, endDate, action, email } = this.initialFilters();
    this.startDate.set(startDate);
    this.endDate.set(endDate);
    this.action.set(action);
    this.email.set(email);
  }

  prepare(): void {
    if (!isValidPeriod(this.startDate(), this.endDate())) {
      this.error.set('Informe um intervalo de datas válido.');
      return;
    }
    this.exporting.set(true);
    this.error.set('');
    this.exportLogs
      .execute({ startDate: this.startDate(), endDate: this.endDate(), action: this.action(), email: this.email() })
      .subscribe({
        next: (csv) => {
          // O BOM faz o Excel abrir o arquivo como UTF-8.
          const blob = new Blob(['﻿', csv.content], { type: 'text/csv;charset=utf-8' });
          this.fileUrl.set(URL.createObjectURL(blob));
          this.filename.set(csv.filename);
          this.exporting.set(false);
        },
        error: () => {
          this.error.set('Falha ao buscar os registros para exportação. Tente novamente.');
          this.exporting.set(false);
        },
      });
  }

  discardFile(): void {
    const url = this.fileUrl();
    if (url) URL.revokeObjectURL(url);
    this.fileUrl.set('');
    this.filename.set('');
  }

  close(): void {
    if (!this.exporting()) this.closed.emit();
  }
}
