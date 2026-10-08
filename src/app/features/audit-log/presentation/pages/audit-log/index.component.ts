import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';
import { DataTableComponent } from '../../../../../shared/ui/data-table/index.component';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { AuditLogFacade } from '../../../application/index.facade';
import { AUDIT_ACTIONS, AUDIT_ACTION_LABELS } from '../../../domain/index.model';
import { describeAuditLog, userLabel } from '../../../domain/index.rules';
import { AuditExportModalComponent } from '../../components/export-modal/index.component';

@Component({
  selector: 'app-audit-log',
  imports: [DatePipe, FormsModule, ButtonComponent, DataTableComponent, PaginationComponent, TextFieldComponent, AuditExportModalComponent],
  providers: [AuditLogFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogComponent {
  protected readonly facade = inject(AuditLogFacade);
  protected readonly actions = AUDIT_ACTIONS;
  protected readonly actionLabels = AUDIT_ACTION_LABELS;
  protected readonly describe = describeAuditLog;
  protected readonly userLabel = userLabel;
  readonly exportOpen = signal(false);
}
