# Tarefas — Planos, cadastro de empresas e visão por companhia

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** em andamento.

As dependências "API Task N" apontam para `supply-chain-verde-api/docs/features/010-empresas-planos/tasks.md`. Cada task mexe em até 15 arquivos (contando specs, e apagar ou mover como um arquivo); a lista de arquivos é uma estimativa.

---

## Cadastro

### Task 1 — `refactor/company-fields`

Não depende da API.

- [x] Mover `supplier-fields/index.helper.ts` e os value objects de endereço e CNPJ para `shared/forms/company-fields/`, com o nome `company` (plan §2)
- [x] Atualizar os imports em `suppliers`, `batches` (`new-supplier-form`) e `profile`

**Arquivos (~10):** helper, `address` vo + spec, `cnpj` vo + spec, `suppliers/index.ts`, `suppliers` create-modal e `pages/list`, `new-supplier-form`, página de perfil.

**Pronto:** nada muda na tela; `npm test` verde.

### Task 2 — `feat/plans-page`

Depende da API Task 2.

- [x] Esqueleto da feature `signup`: `index.ts`, `index.routes.ts` e modelo `Plan` (plan §2)
- [x] Repositório e DTO Zod de `GET /plans`
- [x] Componente `public-header` (marca + **Entrar**)
- [x] Página de planos e rota `planos` com `guestGuard` em `app.routes.ts` (RF-02, RF-03)
- [x] Testes do repositório e da página: três planos; **Escolher** → `/cadastro?plano=PRO`

**Arquivos (~13):** `index.ts`, `index.routes.ts`, `domain/index.model.ts`, DTO, repositório + spec, `public-header` (ts, html, css), `pages/plans` (ts, html, css, spec), `app.routes.ts`.

**Pronto:** `/planos` abre direto pela URL e mostra os planos da API.

### Task 3 — `feat/signup-wizard`

Depende da API Task 2 e das Tasks 1 e 2.

- [x] Modelo `CompanySignup` e validação de senha
- [x] `POST /companies` no repositório e `SignUpUseCase` com `setSession` e mapeamento do 409 por passo (RF-06, RF-07)
- [x] Página `sign-up` com os 3 passos e rota `cadastro`; plano inválido volta para `/planos` (RF-04, RF-05, RNF-02)
- [x] CTA da landing → `/planos` (RF-01)
- [x] Testes do use case e da página; `login.cy.ts` e o novo `signup.cy.ts`

**Arquivos (~15):** modelo, DTO, repositório + spec, use case + spec, `pages/sign-up` (ts, html, css, spec), `index.routes.ts`, landing html + spec, `login.cy.ts`, `signup.cy.ts`.

**Pronto:** da landing até o dashboard logado, sem passar pelo login.

## Sessão e companhia

### Task 4 — `feat/company-session`

Depende da API Task 3.

- [x] `platform_admin`, `COMPANY_TYPES` e `ROLES_BY_COMPANY_TYPE` no modelo de sessão (plan §1)
- [x] `companyId()` e `companyType()` no `SessionService`; campos novos no DTO do current user e no `loginResponseSchema`
- [x] `NAV_LINKS` por tipo de companhia e `navLinksFor` (RF-08a); nome da companhia no top-nav (RF-09)
- [x] `roleGuard` com `data.companyTypes`; rotas `suppliers` (`['market']`), `users` (sem `roleGuard`) e `audit-log` (`+ platform_admin`) em `app.routes.ts`
- [x] Labels de auditoria para os campos novos (plan §4)
- [x] Testes de sessão, guard e top-nav

**Arquivos (~14):** `session/index.model.ts`, `session/index.service.ts` + spec, `current-user/index.dto.ts`, `auth/infrastructure/index.dto.ts`, `navigation/index.constants.ts`, guard + spec, top-nav (ts, html, spec), `app.routes.ts`, `audit-log/domain/index.labels.ts`.

**Pronto:** cada combinação de companhia e perfil vê o menu do RF-08a, e o fornecedor é barrado em `/suppliers`.

### Task 5 — `feat/users-by-company`

Depende da API Task 3 e da Task 4.

- [x] `canManageUsers` só para `admin` e `platform_admin`; `creatableRoles(companyType)`; sai o `refine` de `supplierId` (plan §4)
- [x] Modal sem seletor de fornecedor; `role-menu` com os perfis do tipo da companhia
- [x] Lista só leitura para quem não é admin; sai "Fornecedor", entra "Empresa" para o `platform_admin` (RF-11)
- [x] Erro 409 de limite do plano como toast
- [x] Testes de regras, do modal, do menu e da lista

**Arquivos (~14):** regras + spec, modelo, DTO, create-modal (ts, html, spec), role-menu (ts, html, spec), `pages/list` (ts, html, spec).

**Pronto:** o admin de um fornecedor cria um usuário `supplier` e recebe o erro de limite no plano Basic.

### Task 6 — `feat/dashboard-pending-batches`

Depende da API Task 3 e da Task 4.

- [x] `pendingBatches` nullable no schema e no modelo do summary
- [x] Card "Lotes pendentes" para o fornecedor, com link para `/batches?status=PENDING` (RF-08b)
- [x] Testes de regras e da página

**Arquivos (~8):** DTO, modelo, regras + spec, repositório spec, página (ts, html, spec).

**Pronto:** o fornecedor vê "Lotes pendentes" no lugar de "Fornecedores".

### Task 7 — `feat/profile-company`

Depende da API Task 3 e das Tasks 1 e 4.

- [x] `GET` e `PATCH /companies/me` no repositório de `profile` (plan §3)
- [x] Seção da companhia para `admin` de qualquer tipo, com plano e uso de contas (RF-10)
- [x] Sem imports de `suppliers` (`UpdateOwnSupplierUseCase`, `SuppliersRepository`, `PasswordChange`)
- [x] Testes de regras, repositório e página

**Arquivos (~9):** modelo, regras + spec, repositório + spec, página (ts, html, css, spec).

**Pronto:** o admin edita a própria companhia em `/profile` e vê "2 de 3 contas".

## Fornecedores

### Task 8 — `feat/suppliers-worked-with`

Depende da API Task 3.

- [x] `loadRanking` com `workedWith`, sem `withoutUser` e `productId`; `workedWith` no DTO e no modelo (plan §3)
- [x] Signal `workedWithOnly` na facade, lembrado no `localStorage` com `try/catch` (RF-12a)
- [x] Toggle ao lado da busca, selo "Já trabalhou" e relatórios só com `workedWith` (RF-12b)
- [x] Testes do repositório, da facade e da lista

**Arquivos (~9):** DTO, modelo, repositório + spec, facade + spec, `pages/list` (ts, html, spec).

**Pronto:** o filtro recarrega o ranking e volta como estava ao reabrir a tela.

## Lotes

### Task 9 — `feat/batch-status`

Depende da API Task 4.

- [x] `status`, `rejectionReason`, `marketId` e `marketName` no DTO e no modelo; `producedAt` nullable (plan §5)
- [x] `status` no repositório e filtro `app-enum-select` na lista (RF-14)
- [x] Componente `status-badge` no card
- [x] `canCreateBatch` por tipo de companhia e `canAddStageTo` por status
- [x] Testes de regras, repositório, card e lista

**Arquivos (~15):** DTO, modelo, repositório + spec, regras + spec, `status-badge` (ts, css, spec), batch-card (ts, html, spec), `pages/list` (ts, html, spec).

**Pronto:** a lista mostra o status de cada lote e filtra por ele.

### Task 10 — `feat/batch-reject`

Depende da API Task 4 e da Task 9.

- [x] Regra `canReject(batch)`
- [x] `PATCH /batches/{id}/reject` no repositório e use case de recusa
- [x] `reject-modal` com motivo obrigatório; **Recusar** no card e motivo no lote recusado (RF-15)
- [x] Testes de regra, use case, repositório e modal

**Arquivos (~14):** regras + spec, repositório + spec, use case + spec, `reject-modal` (ts, html, css, spec), batch-card (ts, html), facade.

**Pronto:** o fornecedor recusa um lote pendente, e o mercado vê o motivo.

### Task 11 — `refactor/remove-inline-creation`

Não depende da API.

- [x] Apagar `new-product-form` e `new-supplier-form` (plan §5)
- [x] Modal de criação e facade sem os ramos de criação inline
- [x] Testes do modal e da facade

**Arquivos (~13):** `new-product-form` (4), `new-supplier-form` (4), create-modal (ts, html, spec), create-batch facade + spec.

**Pronto:** o lote é criado só com produto e fornecedor existentes.

### Task 12 — `refactor/products-feature`

Depende da Task 11.

- [x] Mover `batches/infrastructure/product` e `batches/domain/product` para `features/products`, exportados pelo `index.ts` (plan §5)
- [x] Atualizar os imports em `batches`

**Arquivos (~13):** repositório, DTO e spec de produto, modelo de produto, `products/index.ts`, `batches/index.ts`, facade + spec, create-batch facade + spec, use case + spec, batch-card.

**Pronto:** nada muda na tela; `npm test` verde.

### Task 13 — `feat/batch-request-modal`

Depende da API Task 4 e das Tasks 9 e 12.

- [x] Modal com os 4 passos e passo 3 com `GET /products?supplierId=` por categoria e unidade (RF-13)
- [x] `NewBatch` sem `producedAt`; `CreateBatchUseCase` com um único POST, sem `concat` nem `CreateSupplierUseCase`
- [x] Testes do modal, da facade e do use case; `register-batch-flow.cy.ts` com `manager` e o body novo

**Arquivos (~12):** create-modal (ts, html, spec), create-batch facade + spec, use case + spec, modelo, repositório de produto + spec, `register-batch-flow.cy.ts`.

**Pronto:** o mercado pede o lote, e o fornecedor vê o lote pendente.

### Task 14 — `refactor/remove-supplier-crud`

Depende das Tasks 7 e 13 (perfil e lotes deixam de usar os use cases de fornecedor).

- [x] Apagar o create-modal de `suppliers` e os use cases `create`, `update` e `update-own` (plan §3)
- [x] Tirar `create`, `update` e `updateOwn` do repositório e das exportações
- [x] Lista sem o botão **+ Novo fornecedor**, sem o modal e sem o clique no nome (RF-12)
- [x] Testes da lista e dos use cases

**Arquivos (~14):** create-modal (4), 3 use cases, `use-cases/index.use-cases.spec.ts`, repositório + spec, `suppliers/index.ts`, `pages/list` (ts, html, spec).

**Pronto:** a tela de fornecedores é só ranking.

## Produtos e certificações

### Task 15 — `feat/products-page`

Depende da API Task 4 e das Tasks 4 e 12.

- [x] Rota `products` com `roleGuard` e `companyTypes: ['supplier']` (RF-16), e o link **Produtos** no `NAV_LINKS` do fornecedor (admin e supplier)
- [x] Página de lista e modal de criação; `POST /products` no repositório
- [x] Testes do repositório, da página e do modal

**Arquivos (~14):** `index.routes.ts`, `index.ts`, `pages/list` (ts, html, css, spec), create-modal (ts, html, css, spec), repositório + spec, `app.routes.ts`.

**Pronto:** o fornecedor lista e cadastra os próprios produtos em `/products`.

### Task 16 — `refactor/certifications-list`

Não depende da API.

- [x] Extrair a lista e as ações do `certifications-modal` para um componente de `certifications` (plan §6)
- [x] Modal da tela de Fornecedores usa o componente, sem mudança de status (só leitura)
- [x] Testes do componente e do modal

**Arquivos (~8):** componente novo (ts, html, css, spec), `certifications-modal` (ts, html, spec), `certifications/index.ts`.

**Pronto:** o varejista consulta as certificações sem poder mudar o status.

### Task 17 — `feat/certifications-page`

Depende da API Task 4 e das Tasks 4 e 16.

- [x] Rota `certifications` com `companyTypes: ['supplier']` (RF-17), e o link **Certificações** no `NAV_LINKS` do fornecedor (admin e supplier)
- [x] Página que lista, cadastra com o `form` atual e muda o status das próprias certificações
- [x] Testes da página

**Arquivos (~8):** `index.routes.ts`, `pages/list` (ts, html, css, spec), repositório + spec, `app.routes.ts`.

**Pronto:** o fornecedor gerencia as próprias certificações em `/certifications`.
