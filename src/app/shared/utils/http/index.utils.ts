import { HttpErrorResponse } from '@angular/common/http';

/**
 * Mensagem da API para erros de regra (400/409), rate limit (429) e falha de serviço externo (502); demais erros usam
 * o texto padrão da tela.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message =
    error instanceof HttpErrorResponse && [400, 409, 429, 502].includes(error.status) ? error.error?.message : null;
  return typeof message === 'string' && message ? message : fallback;
}
