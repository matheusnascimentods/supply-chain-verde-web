# Tarefas — Assinatura única e ativação de usuários

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** planejada.

Cada task mexe em **no máximo 10 arquivos** (specs contam) e deixa o `npm test` verde. A dependência "API Task N" aponta para `supply-chain-verde-api/docs/features/016-assinatura-assentos/tasks.md`.

Ordem entre os repositórios: **API Task 1 → web Task 1 → web Task 2 → API Task 2 → API Task 3 → web Task 3 → web Task 4 → API Task 4 → API Task 5 → web Task 5**.

---

### Task 1 — `feat/pagina-assinatura`

Depende da API Task 1 em produção: o `POST /companies` aceita o cadastro sem `planCode`.

- [x] `app.routes.ts`: `/planos` renomeada para `/assinatura` (plan §1)
- [x] `signup/index.routes.ts`, e `pages/plans` → `pages/subscription` (ts, html, css, spec)
- [x] `signup` model, repository e dto sem `Plan`/`listPlans`/`planCode`
- [x] `pages/sign-up` (ts, html, spec) sem plano
- [x] Landing: CTA e spec
- [x] Cypress `signup.cy.ts` e `login.cy.ts`

Se passar de 10 arquivos, o Cypress vai num commit próprio da mesma branch.

**Arquivos (~10):** `app.routes.ts`, `signup/index.routes.ts`, `subscription/*`, `signup/domain/index.model.ts`, `signup/infrastructure/*`, `sign-up/*`, `landing/*`, Cypress.

**Pronto:** `npm test` verde. `/assinatura` abre, `/planos` não existe mais, e o cadastro completo funciona no compose.

### Task 2 — `feat/perfil-assentos`

Depende da API Task 1 (`maxUsers`/`seatsUsed` em `/companies/me`).

- [ ] `profile` model, rules e repository (plan §2)
- [ ] `pages/profile` (ts, html, css) com a seção "Assinatura"
- [ ] Specs de rules, repository e componente

**Arquivos (~9).**

**Pronto:** `npm test` verde. O perfil de `h.kane@bayern.com` mostra "10 de 10 em uso", e a página não chama `GET /users`.

### Task 3 — `feat/ativacao-usuarios`

Depende da API Task 2 em produção (`PATCH /users/{id}/status` e `active` no usuário).

- [ ] `users` model, dto e repository: `active`, `updateStatus` e `seats` (plan §3)
- [ ] `users/domain/index.rules.ts`: `canToggleStatus` e `seatsFull`
- [ ] `use-cases/update-status` e o facade (`seats`, `toggleStatus`)
- [ ] `components/status-badge`
- [ ] `pages/list` (ts, html, css): coluna Situação, contador, botões desabilitados e o menu de perfil travado em inativo
- [ ] Specs de rules, repository, facade e lista

**Arquivos (~10).**

**Pronto:** `npm test` verde. No compose, desativar e reativar atualiza o contador, e com 10/10 os botões ficam desabilitados.

### Task 4 — `feat/filtros-usuarios`

Depende da API Task 3 em produção (`role` e `active` em `GET /users`).

- [ ] `UsersRepository.load` com `roles`/`active` (plan §4)
- [ ] Facade: `roles`, `active`, `toggleRole`, `setActive` e `filterRoles`
- [ ] `pages/list` (html, css): os dois grupos de filtro
- [ ] Specs de repository, facade e lista

**Arquivos (~7).**

**Pronto:** `npm test` verde. Gestor + Auditor + Inativos filtram na tela.

### Task 5 — `docs/assinatura-assentos`

Depende das Tasks 1 a 4.

- [ ] `docs/features/009-empresas-planos/spec.md`: nota de que a escolha de plano foi substituída por esta feature
- [ ] Status desta feature: concluída

**Pronto:** a documentação bate com a tela.
