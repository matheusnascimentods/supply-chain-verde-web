import { HttpErrorResponse } from '@angular/common/http';

/** Mensagem da API para erros de regra (400/409); demais erros usam o texto padrão da tela. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof HttpErrorResponse && [400, 409].includes(error.status) ? error.error?.message : null;
  return typeof message === 'string' && message ? message : fallback;
}
