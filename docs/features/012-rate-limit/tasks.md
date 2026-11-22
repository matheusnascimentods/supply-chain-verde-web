# Tarefas — Rate limit

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** concluída.

A dependência "API Task N" aponta para `supply-chain-verde-api/docs/features/013-rate-limit/tasks.md`. Cada task mexe em até 15 arquivos. Specs contam. A lista de arquivos é uma estimativa.

---

### Task 1 — `feat/rate-limit-message`

Não depende da API para o merge, porque os testes usam stub. Só tem efeito em produção depois da API Task 1.

- [x] `apiErrorMessage` com `429` + spec (plan §1, RF-01)
- [x] Login usando `apiErrorMessage` + spec (plan §2, RF-02)
- [x] Caso de `429` no spec do `authInterceptor` (plan §3, RF-03)
- [x] Cenário `429` em `cypress/e2e/login.cy.ts` (plan §4)

**Arquivos (~6):** `shared/utils/http/index.utils.ts` + spec, `auth/presentation/pages/login/index.component.ts` + spec, `core/auth/interceptors/index.interceptor.spec.ts`, `cypress/e2e/login.cy.ts`.

**Pronto:** `npm test` e `npm run cypress:run` verdes. Com a API local, a 6ª senha errada seguida mostra a mensagem do `429`.
