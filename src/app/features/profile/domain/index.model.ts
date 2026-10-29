/** Corpo do `PATCH /users/me`: só os campos alterados. */
export interface AccountPatch {
  userName?: string;
  currentPassword?: string;
  newPassword?: string;
}
