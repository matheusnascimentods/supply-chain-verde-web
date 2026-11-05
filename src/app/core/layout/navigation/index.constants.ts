import type { CompanyType, UserRole } from '../../auth/session/index.model';

export interface NavLink {
  label: string;
  path: string;
}

const SUPPLIERS: NavLink = { label: 'Fornecedores', path: '/suppliers' };
const BATCHES: NavLink = { label: 'Lotes', path: '/batches' };
const USERS: NavLink = { label: 'Usuários', path: '/users' };
const AUDIT: NavLink = { label: 'Auditoria', path: '/audit-log' };

// Menu por tipo de companhia e perfil (RF-08a); admin de varejista e de fornecedor veem menus diferentes.
// ponytail: Produtos e Certificações do fornecedor entram junto com as rotas (Tasks 15 e 17), para não ter link quebrado.
export const NAV_LINKS: Record<CompanyType | 'platform', Partial<Record<UserRole, NavLink[]>>> = {
  market: {
    admin: [SUPPLIERS, BATCHES, USERS, AUDIT],
    manager: [SUPPLIERS, BATCHES, USERS],
    auditor: [AUDIT, SUPPLIERS, BATCHES, USERS],
  },
  supplier: {
    admin: [BATCHES, USERS, AUDIT],
    supplier: [BATCHES, USERS],
  },
  platform: {
    platform_admin: [SUPPLIERS, BATCHES, USERS, AUDIT],
  },
};

export function navLinksFor(companyType: CompanyType | null, role: UserRole | null): NavLink[] {
  const menus = role === 'platform_admin' ? NAV_LINKS.platform : companyType ? NAV_LINKS[companyType] : {};
  return (role && menus[role]) || [];
}
