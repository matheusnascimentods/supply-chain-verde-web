import { digitsOnly } from '../../../shared/utils/format/index.utils';
import { AccountPatch, CompanyForm, CompanyPatch, PasswordChange } from './index.model';

// Senha em branco = não muda; nova senha exige a atual e a confirmação igual.
export function passwordChangeErrors(change: PasswordChange): Record<string, true> | null {
  if (!change.newPassword && !change.confirmPassword) return null;
  if (change.newPassword !== change.confirmPassword) return { passwordMismatch: true };
  if (!change.currentPassword) return { currentPasswordRequired: true };
  return null;
}

// Só o nome alterado e a senha, se houver nova.
export function accountPatch(initialName: string, userName: string, password: PasswordChange): AccountPatch {
  const patch: AccountPatch = {};
  if (userName !== initialName) patch.userName = userName;
  if (password.newPassword) {
    patch.currentPassword = password.currentPassword;
    patch.newPassword = password.newPassword;
  }
  return patch;
}

// Telefone e CEP vão só com dígitos; a máscara do formulário não conta como mudança.
function normalized(company: CompanyForm): CompanyForm {
  return {
    ...company,
    phone: digitsOnly(company.phone),
    address: { ...company.address, zipCode: digitsOnly(company.address.zipCode), state: company.address.state.toUpperCase() },
  };
}

/** Diferença entre o carregado e o formulário; vazio quando nada mudou. */
export function companyPatch(initial: CompanyForm, current: CompanyForm): CompanyPatch {
  const before = normalized(initial);
  const after = normalized(current);
  const patch: CompanyPatch = {};
  if (after.name !== before.name) patch.name = after.name;
  if (after.email !== before.email) patch.email = after.email;
  if (after.phone !== before.phone) patch.phone = after.phone;
  if (JSON.stringify(after.address) !== JSON.stringify(before.address)) patch.address = after.address;
  return patch;
}

/** Uso do plano, ex.: "2 de 3 contas". */
export function accountsUsage(used: number, maxUsers: number): string {
  return `${used} de ${maxUsers} ${maxUsers === 1 ? 'conta' : 'contas'}`;
}
