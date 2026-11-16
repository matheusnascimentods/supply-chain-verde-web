export const MIN_PASSWORD_LENGTH = 8;

// A API só exige senha não vazia; o mínimo e a confirmação são regras do front (cadastro e convite).
export function passwordErrors({ password, confirmPassword }: { password: string; confirmPassword: string }): Record<string, true> | null {
  if (password.length < MIN_PASSWORD_LENGTH) return { passwordTooShort: true };
  if (password !== confirmPassword) return { passwordMismatch: true };
  return null;
}
