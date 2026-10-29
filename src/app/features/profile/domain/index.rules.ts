import type { PasswordChange } from '../../suppliers';
import { AccountPatch } from './index.model';

// Senha em branco = não muda; nova senha exige a atual e a confirmação igual.
export function passwordChangeErrors(change: PasswordChange): Record<string, true> | null {
  if (!change.newPassword && !change.confirmPassword) return null;
  if (change.newPassword !== change.confirmPassword) return { passwordMismatch: true };
  if (!change.currentPassword) return { currentPasswordRequired: true };
  return null;
}

// Mesma regra de diff do fornecedor: só o nome alterado e a senha, se houver nova.
export function accountPatch(initialName: string, userName: string, password: PasswordChange): AccountPatch {
  const patch: AccountPatch = {};
  if (userName !== initialName) patch.userName = userName;
  if (password.newPassword) {
    patch.currentPassword = password.currentPassword;
    patch.newPassword = password.newPassword;
  }
  return patch;
}
