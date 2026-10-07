import type { UserRole } from '../../core/auth/session/index.model';
import type { RoleDashboard } from './index.schema';

export const DASHBOARDS = {
  admin: {
    title: 'Visão geral do sistema',
    description: 'Acesse as áreas de gestão e acompanhe a atividade da plataforma.',
  },
  manager: {
    title: 'Resumo da operação',
    description: 'Aqui está o resumo da sua operação hoje',
  },
  auditor: {
    title: 'Acompanhamento de conformidade',
    description: 'Revise certificações e fornecedores e acompanhe os registros de auditoria.',
  },
  supplier: {
    title: 'Sua operação',
    description: 'Acompanhe seus lotes e mantenha suas certificações. Relatórios ficam disponíveis na gestão do fornecedor.',
  },
} satisfies Record<UserRole, RoleDashboard>;
