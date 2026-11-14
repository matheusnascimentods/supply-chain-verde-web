# Plano técnico — Convite de usuários

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. Feature `users`: criação vira convite

A estrutura (domain / infrastructure / application / presentation) é a mesma. O que muda:

| Hoje | Depois |
|---|---|
| `NewUser { name, email, password, role }` em `domain/index.model.ts` | `NewInvite { email, role }` |
| `UsersRepository.create()` → `POST /users` | `UsersRepository.invite()` → `POST /invites` (201, sem corpo: `Observable<void>`) |
| `application/use-cases/create-user/` | `application/use-cases/send-invite/`, com o mesmo tratamento de erro: 409 e 502 viram toast via `apiErrorMessage` |
| `presentation/components/create-modal/` | `presentation/components/invite-modal/`: form com `email` e `role`. Usar `git mv` mantém o histórico |
| Botão **Novo usuário** na lista | **Convidar usuário**, e o sucesso mostra toast em vez de `reload()` |

`canCreateUsers` e `creatableRoles` em `domain/index.rules.ts` continuam iguais. A regra não mudou, só o meio.

## 2. Feature nova `invites`

Fica em `src/app/features/invites/` e segue o padrão de `signup`:

```
index.ts / index.routes.ts
domain/index.model.ts            InviteDetails { email, role, companyName, expiresAt }, InviteAcceptance { token, name, password }
infrastructure/index.dto.ts      Zod de GET /invites/{token}; aceite reusa o formato de LoginResponse (token, role)
infrastructure/index.repository  find(token) e accept(acceptance)
application/use-cases/accept/    accept → session.setSession(token, role, email), igual SignUpUseCase
presentation/pages/accept/       página com 3 estados: loading | invalid | form
```

- **Rota** em `app.routes.ts`: `{ path: 'convites/:token', canActivate: [guestGuard], loadChildren: () => import('./features/invites') }`.
- **Token:** a página lê com `ActivatedRoute.snapshot.paramMap.get('token')`. O valor do link é o token em texto puro; o hash fica só no banco da API.
- **Estado `invalid`:** é ativado por um 404 no `find` ou no `accept`. Outros erros mostram a mensagem genérica de erro com opção de tentar de novo.
- **Senha:** `passwordErrors` e `MIN_PASSWORD_LENGTH` estão em `signup/domain/index.model.ts`, e `profile/domain/index.rules.ts` tem uma cópia. Para a feature nova não ser a terceira cópia, os dois vão para `shared/forms/password/index.validator.ts`, e `signup` e `invites` passam a importar de lá. A cópia de `profile` fica para outra hora, porque ela valida senha atual e é outra forma.
- **Cabeçalho:** reusa o `public-header` do `signup` (marca e **Entrar**), exportado pelo `signup/index.ts`.
- **Referrer:** `<meta name="referrer" content="no-referrer">` em `src/index.html`. Vale para o app inteiro, e o app não depende de referrer.

## 3. Testes

- Specs Jest do repositório (`find`, `accept` e parse do DTO), do use case (grava a sessão) e da página (os 3 estados, a validação de senha e o redirecionamento).
- Na feature `users`: specs do `invite-modal`, do use case `send-invite` e da lista (botão e toast).
- Cypress `cypress/e2e/invite.cy.ts` com `cy.intercept`:
  - o admin convida e vê o toast
  - um link válido leva a aceitar e cair no dashboard
  - um link inválido mostra o aviso
