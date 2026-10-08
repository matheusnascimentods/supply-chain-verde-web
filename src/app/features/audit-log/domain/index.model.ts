export const AUDIT_ACTIONS = ['INSERT', 'UPDATE', 'DELETE', 'STATUS_CHANGE'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  INSERT: 'Cadastro',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
  STATUS_CHANGE: 'Alteração de status',
};

export type AuditData = Record<string, unknown>;

export interface AuditLog {
  logId: number;
  userId?: number | null;
  userEmail?: string | null;
  action: AuditAction;
  affectedTable?: string | null;
  affectedEntityId?: number | null;
  beforeData?: AuditData | null;
  afterData?: AuditData | null;
  performedAt: string;
}

export interface AuditLogFilters {
  startDate: string;
  endDate: string;
  /** Vazio = todas as operações. */
  action: AuditAction | '';
  email: string;
}

export interface AuditLogPage {
  items: AuditLog[];
  hasNext: boolean;
  totalPages: number;
}
