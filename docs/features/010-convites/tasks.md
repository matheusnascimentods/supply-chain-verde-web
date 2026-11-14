# Tarefas — Convite de usuários

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** planejada.

As dependências "API Task N" apontam para `supply-chain-verde-api/docs/features/011-convites/tasks.md`. Cada task mexe em até 15 arquivos. Specs contam, e apagar ou mover conta como um arquivo. A lista de arquivos é uma estimativa.

---

### Task 1 — `feat/users-invite-modal`

Depende da API Task 4, que remove o `POST /users`. Pode começar depois da API Task 2, mas o merge só acontece depois da Task 4, para o front não perder a criação antes da hora.

- [ ] `NewUser` → `NewInvite` e `UsersRepository.create` → `invite` (`POST /invites`) (plan §1)
- [ ] Use case `create-user` → `send-invite`
- [ ] `create-modal` → `invite-modal` (só email e perfil) (RF-02)
- [ ] Lista: botão **Convidar usuário** e toast de sucesso (RF-01, RF-03, RF-04)

**Arquivos (~13):** `domain/index.model.ts`, repositório + spec, use case + spec, `invite-modal` (ts, html, css, spec), `pages/list` (ts, html, spec), `index.facade.ts`.

**Pronto:** não sobra referência a `create-user`/`create-modal` na feature `users`, e o `npm test` está verde.

### Task 2 — `feat/invite-accept-page`

Depende da API Task 3.

- [ ] Mover `passwordErrors`/`MIN_PASSWORD_LENGTH` para `shared/forms/password/` e atualizar o `signup` (plan §2)
- [ ] Esqueleto da feature `invites`: `index.ts`, rotas, modelo, DTO Zod e repositório + spec
- [ ] Use case `accept` + spec (grava a sessão)
- [ ] Página `accept` com os estados loading, invalid e form (RF-06 a RF-10) + spec
- [ ] Rota `convites/:token` com `guestGuard` em `app.routes.ts` (RF-05)

**Arquivos (~15):** `shared/forms/password/index.validator.ts`, `signup/domain/index.model.ts`, `sign-up` page ts, `invites/index.ts`, `index.routes.ts`, `domain/index.model.ts`, DTO, repositório + spec, use case + spec, `pages/accept` (ts, html, spec), `app.routes.ts`.

Os estilos da página reusam os do cadastro, então não entra `.css` novo. Se precisar de um, o `export` do `public-header` no `signup/index.ts` passa para a Task 3 para caber no limite.

**Pronto:** `/convites/<token>` funciona contra a API local. Para testar, o link sai no email enviado pelo SendGrid de dev.

### Task 3 — `test/invite-e2e`

Depende das Tasks 1 e 2.

- [ ] `cypress/e2e/invite.cy.ts` com os 3 cenários do plan §3
- [ ] `<meta name="referrer" content="no-referrer">` em `src/index.html` (RF-11)
- [ ] README: fluxo de convite no lugar da criação de usuário

**Arquivos (~3):** `invite.cy.ts`, `src/index.html`, `README.md`.

**Pronto:** `npm run e2e` verde, e a documentação bate com a tela.
