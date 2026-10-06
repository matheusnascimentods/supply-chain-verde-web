import type { UserRole } from '../../core/auth/session/index.model';
import type { RoleDashboard } from './index.schema';

export const DASHBOARDS = {
  admin: {
    title: 'Visão geral do sistema',
    description: 'Acesse as áreas de gestão e acompanhe a atividade da plataforma.',
    links: [
      { label: 'Fornecedores', path: '/suppliers' },
      { label: 'Lotes', path: '/batches' },
      { label: 'Usuários', path: '/users' },
      { label: 'Auditoria', path: '/audit-log' },
    ],
  },
  manager: {
    title: 'Resumo da operação',
    description: 'Aqui está o resumo da sua operação hoje',
    links: [
      { label: 'Fornecedores', path: '/suppliers' },
      { label: 'Lotes', path: '/batches' },
    ],
  },
  auditor: {
    title: 'Acompanhamento de conformidade',
    description: 'Revise certificações e fornecedores e acompanhe os registros de auditoria.',
    links: [
      { label: 'Auditoria do sistema', path: '/audit-log' },
      { label: 'Fornecedores', path: '/suppliers' },
      { label: 'Lotes', path: '/batches' },
    ],
  },
  supplier: {
    title: 'Sua operação',
    description: 'Acompanhe seus lotes e mantenha suas certificações. Relatórios ficam disponíveis na gestão do fornecedor.',
    links: [
      { label: 'Meus lotes', path: '/batches' },
      { label: 'Meu perfil', path: '/suppliers/me' },
      { label: 'Fornecedores', path: '/suppliers' },
    ],
  },
} satisfies Record<UserRole, RoleDashboard>;
