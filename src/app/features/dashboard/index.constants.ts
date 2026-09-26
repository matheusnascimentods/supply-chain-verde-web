import type { UserRole } from '../../core/session/index.schema';
import type { RoleDashboard } from './index.schema';

export const DASHBOARDS = {
  admin: {
    title: 'Visão geral do sistema',
    description: 'Acesse as áreas de gestão e acompanhe a atividade da plataforma.',
    links: [
      { label: 'Gerenciar usuários', path: '/users' },
      { label: 'Consultar auditoria', path: '/audit-log' },
      { label: 'Gerenciar fornecedores', path: '/suppliers' },
      { label: 'Consultar lotes', path: '/batches' },
    ],
  },
  manager: {
    title: 'Resumo da operação',
    description: 'Aqui está o resumo da sua operação hoje',
    links: [
      { label: 'Fornecedores', path: '/suppliers' },
      { label: 'Ranking de fornecedores', path: '/suppliers/ranking' },
      { label: 'Produtos', path: '/products' },
      { label: 'Relatórios', path: '/reports' },
    ],
  },
  auditor: {
    title: 'Acompanhamento de conformidade',
    description: 'Revise certificações, consulte relatórios e acompanhe os registros de auditoria.',
    links: [
      { label: 'Certificações', path: '/certifications' },
      { label: 'Relatórios', path: '/reports' },
      { label: 'Auditoria do sistema', path: '/audit-log' },
      { label: 'Ranking de fornecedores', path: '/suppliers/ranking' },
    ],
  },
  supplier: {
    title: 'Sua operação',
    description: 'Acompanhe seus lotes, mantenha suas certificações e consulte seus relatórios.',
    links: [
      { label: 'Meus lotes', path: '/batches' },
      { label: 'Minhas certificações', path: '/certifications' },
      { label: 'Meus relatórios', path: '/reports' },
      { label: 'Meu perfil', path: '/suppliers/me' },
    ],
  },
} satisfies Record<UserRole, RoleDashboard>;
