# Plano técnico — Rate limit

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. `apiErrorMessage` (RF-01)

`src/app/shared/utils/http/index.utils.ts`: inclui o `429` na lista de status cuja mensagem vem da API.

```ts
const message = error instanceof HttpErrorResponse && [400, 409, 429, 502].includes(error.status) ? error.error?.message : null;
```

As 13 chamadas existentes (formulários de produto, certificação, lote, relatório, perfil, convite e cadastro) ganham o comportamento sem mudança nenhuma.

## 2. Login (RF-02)

`features/auth/presentation/pages/login/index.component.ts`: o `error` do `subscribe` hoje ignora o erro e grava a mensagem genérica. Passa a usar `apiErrorMessage(error, genericMessage)`. O `401` de credenciais erradas não está na lista do `apiErrorMessage`, então continua caindo no `genericMessage`. Não há como a API revelar se o email existe.

## 3. Interceptor (RF-03)

Nada muda. O `authInterceptor` só limpa a sessão em 401 e 403. O spec dele ganha um caso que garante que o `429` não faz logout.

## 4. Testes

- **Vitest:**
  - `index.utils.spec.ts`: `429` com `message` devolve a mensagem da API, e `429` sem corpo devolve o fallback.
  - spec da página de login: um `429` mostra a mensagem da API, e um `401` mostra a mensagem genérica.
  - spec do `authInterceptor`: um `429` não chama `clearSession` nem navega.
- **Cypress:** um cenário novo em `cypress/e2e/login.cy.ts`, com `cy.intercept('POST', '**/api/v1/auth/login', { statusCode: 429, headers: { 'Retry-After': '42' }, body: { message: 'Muitas requisições. Tente novamente em instantes.' } })`. Ele confere que a mensagem aparece e que a URL continua em `/login`.
- **Ponta a ponta com a API de verdade:** com a API local, errar a senha 6 vezes seguidas na tela de login mostra a mensagem do `429` na 6ª tentativa.
