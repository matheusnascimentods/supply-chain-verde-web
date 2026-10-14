import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './index.utils';

describe('apiErrorMessage', () => {
  const response = (status: number, message?: string) => new HttpErrorResponse({ status, error: { message } });

  it('uses the API message for business errors', () => {
    expect(apiErrorMessage(response(409, 'Email já cadastrado: ana@x.com'), 'padrão')).toBe('Email já cadastrado: ana@x.com');
    expect(apiErrorMessage(response(400, 'Senha atual incorreta.'), 'padrão')).toBe('Senha atual incorreta.');
  });

  it('falls back for other errors or missing messages', () => {
    expect(apiErrorMessage(response(500, 'Erro interno inesperado.'), 'padrão')).toBe('padrão');
    expect(apiErrorMessage(response(409), 'padrão')).toBe('padrão');
    expect(apiErrorMessage(new Error('x'), 'padrão')).toBe('padrão');
  });
});
