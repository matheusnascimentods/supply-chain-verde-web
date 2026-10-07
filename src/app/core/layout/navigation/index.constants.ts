import type { UserRole } from '../../auth/session/index.model';

export interface NavLink {
  label: string;
  path: string;
}

export const NAV_LINKS: Record<UserRole, NavLink[]> = {
  admin: [
    { label: 'Fornecedores', path: '/suppliers' },
    { label: 'Lotes', path: '/batches' },
    { label: 'Usuários', path: '/users' },
    { label: 'Auditoria', path: '/audit-log' },
  ],
  manager: [
    { label: 'Fornecedores', path: '/suppliers' },
    { label: 'Lotes', path: '/batches' },
  ],
  auditor: [
    { label: 'Auditoria do sistema', path: '/audit-log' },
    { label: 'Fornecedores', path: '/suppliers' },
    { label: 'Lotes', path: '/batches' },
  ],
  supplier: [
    { label: 'Meus lotes', path: '/batches' },
    { label: 'Meu perfil', path: '/suppliers/me' },
    { label: 'Fornecedores', path: '/suppliers' },
  ],
};
