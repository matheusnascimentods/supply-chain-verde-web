# Plano técnico — Planos, cadastro de empresas e visão por companhia

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. Sessão e perfis (`core/auth`)

| Arquivo | Mudança |
|---|---|
| `session/index.model.ts` | `USER_ROLES` ganha `'platform_admin'`, e `ROLE_LABELS` ganha "Admin da plataforma". Novos `COMPANY_TYPES = ['market','supplier']`, `CompanyType` e `ROLES_BY_COMPANY_TYPE` (RF-11). |
| `session/index.service.ts` | `companyId()` e `companyType()` decodificados do JWT, como `supplierId()` (linha 54). Não entra nenhuma chave nova no `sessionStorage`. |
| `session/current-user/index.dto.ts` | `+ companyId`, `companyType` e `companyName`, todos nullable. |
| `core/layout/navigation/index.constants.ts` | `NAV_LINKS` passa a ser indexado pelo tipo da companhia: `Record<CompanyType \| 'platform', Partial<Record<UserRole, NavLink[]>>>`, com os menus do RF-08a, e um `navLinksFor(companyType, role)` de uma linha. Não dá mais para indexar só pelo perfil, porque `admin` de varejista e `admin` de fornecedor têm menus diferentes. |
| `core/auth/guards/index.guard.ts` | `roleGuard` passa a aceitar também `data.companyTypes`, comparado com `session.companyType()`; o `platform_admin` sempre passa. As rotas `suppliers` (`['market']`), `products` e `certifications` (`['supplier']`) usam esse filtro. |
| `core/layout/top-nav` | Mostra o `companyName` vindo do `CurrentUserService.load()` (RF-09). |
| `features/auth/infrastructure/index.dto.ts` | `loginResponseSchema` aceita os campos novos com `.passthrough()`, e o `role` passa pelo `userRoleSchema` atualizado. |

As regras de perfil espalhadas pelas features (`suppliers`, `batches`, `users` e `profile`, cada uma com o próprio `type Role`) passam a considerar `platform_admin` onde hoje está `admin`, e o tipo da companhia onde a regra depende dele (`canCreateBatch`, `creatableRoles`).

## 2. Feature `signup` (pública)

```
features/signup/
├── index.ts | index.routes.ts       # '' → planos, 'cadastro' → wizard
├── domain/index.model.ts            # Plan, CompanySignup (empresa + admin), validação de senha
├── infrastructure/index.repository.ts | index.dto.ts   # GET /plans, POST /companies (Zod)
├── application/use-cases/sign-up/index.use-case.ts     # POST /companies → session.setSession(...)
└── presentation/
    ├── components/public-header/    # marca + "Entrar"
    └── pages/plans | pages/sign-up
```

- **Rotas** (`app.routes.ts`, junto das públicas, com `guestGuard`): `planos` e `cadastro`, com `loadChildren` da feature.
- **Landing:** o `routerLink` do CTA (`index.component.html:31`) passa a ser `/planos`.
- **Header:** `public-header` é usado na página de planos e no cadastro. A landing segue sem header (fora do escopo).
- **Wizard:**
  - Segue o padrão de passos do `BatchCreateModalComponent`: array `steps` e um signal de índice. Não há stepper compartilhado, e um só não justifica criar um.
  - Um `FormGroup` por passo.
  - O plano vem de `?plano=`, validado contra a lista de `GET /plans` (RF-04).
- **Campos de empresa:** `formatSupplierFieldsWhileTyping` e `supplierFormValue` (`features/suppliers/presentation/supplier-fields/index.helper.ts`) e o value object de endereço via ViaCEP saem de `suppliers`. Eles vão para `shared/forms/company-fields/` com o nome `company`, porque passam a ser usados pelo cadastro e pelo perfil, e o modal que os criou deixa de existir.
- **Login após o cadastro:** a resposta tem o mesmo formato do login, então o use case chama `session.setSession(token, role, email)`, como o `LoginUseCase` faz.
- **Erros:** 409 vai para o passo do campo em conflito (CNPJ → Empresa, email do admin → Administrador). Para isso, o use case compara a mensagem da API com o campo. Os outros erros vão para o toast, via `apiErrorMessage`.

## 3. Fornecedores e perfil

| Arquivo | Mudança |
|---|---|
| `features/suppliers/presentation/pages/list/index.component.{html,ts}` | Sai o botão (linha 9), o `<app-create-supplier-modal>` (linha 117), o signal `supplierModal` e o clique no nome (linhas 37 e 86). |
| `features/suppliers/presentation/components/create-modal` | Apagado. |
| `features/suppliers/application/use-cases/{create,update,update-own}-supplier` | Apagados, junto com `create`, `update` e `updateOwn` do repositório e as exportações em `index.ts`. |
| `features/suppliers/infrastructure/index.repository.ts` | `loadRanking` perde `withoutUser` e `productId` (a API deixa de aceitar) e ganha `workedWith?: boolean`. O DTO e o modelo de ranking ganham `workedWith`. |
| `features/suppliers/application/index.facade.ts` + `pages/list` | Signal `workedWithOnly`, ligado a um toggle ao lado da busca (RF-12a), que recarrega o ranking. O valor inicial vem do `localStorage` (`suppliers.workedWithOnly`), lido e gravado dentro de `try/catch`; sem valor, começa desligado. O selo "Já trabalhou" e o botão de relatórios dependem de `workedWith` (RF-12b). |
| `features/dashboard` | O card "Fornecedores" vira "Lotes pendentes" quando `companyType === 'supplier'`, lendo `pendingBatches` do summary. O schema Zod ganha `pendingBatches` como nullable (RF-08b). |
| `features/profile` | A seção da companhia passa a valer para `admin` de qualquer tipo, e não só para `supplier`. Carrega com `GET /companies/me` e salva com `PATCH /companies/me`; nome e senha seguem em `PATCH /users/me`. Mostra plano e contas usadas (RF-10). Os imports de `suppliers` saem. |

## 4. Usuários e auditoria

- `features/users/domain/index.rules.ts`:
  - `canManageUsers` passa a ser `admin` ou `platform_admin`; o `manager` sai. A regra controla só o botão **+ Adicionar usuário** e o `role-menu`. Para quem não é admin, a lista é só leitura, e o `role-badge` aparece sem menu (RF-11).
  - `creatableRoles(companyType)` devolve `ROLES_BY_COMPANY_TYPE[type]`.
- `features/users/domain/index.model.ts`: sai o `refine` de `supplierId`.
- `features/users/presentation/components/create-modal`: sai o seletor de fornecedor (linha 42 do ts).
- O menu de troca de perfil (`role-menu`) oferece só os perfis do tipo da companhia do usuário alvo. Para o `platform_admin`, que vê todas as companhias, o tipo vem no item da lista.
- A lista ganha a coluna "Empresa" só para o `platform_admin`.
- A coluna "Fornecedor" da lista sai, e entra "Empresa" só para o `platform_admin`.
- Rota `users` (`app.routes.ts:50`): o `roleGuard` sai, e qualquer usuário logado acessa. Rota `audit-log` (`:57`): `+ 'platform_admin'`.
- `features/audit-log/domain/index.labels.ts`: `ENTITY_LABELS` e `FIELD_LABELS` para `company`, `company_plan`, `market_id`, `status`, `rejection_reason` e `company_id`. O filtro por companhia é feito pela API.

## 5. Lotes e produtos

**DTO e modelo:**
- `batchResponseSchema` ganha `status: z.enum(['PENDING','ACTIVE','REJECTED'])`, `rejectionReason` (nullable), `marketId` e `marketName`.
- `NewBatch` perde `producedAt`, e `producedAt` passa a ser nullable na resposta.

**Modal de criação (`create-modal`):**
- `steps = ['Produto','Fornecedor','Produto do fornecedor','Revisão']`.
- O passo 1 usa só `category` e `unit`, que alimentam o `recommendationCriteria` atual.
- O passo 3 chama `GET /products?supplierId=` filtrado por categoria e unidade.
- Saem `new-product-form`, `new-supplier-form` e o ramo de `session.supplierId()` (linhas 209–231).

**Use case e regras:**
- `CreateBatchUseCase` vira um único POST. Somem o `concat` e o `CreateBatchError` por passo.
- `canCreateBatch` vale para `admin` ou `manager` com `companyType === 'market'`. `canAddStageTo` bloqueia `REJECTED`, e em `PENDING` libera só para o fornecedor.
- Nova regra `canReject(batch)` para fornecedor com lote `PENDING`.

**Listagem:**
- O filtro de status é um `app-enum-select` acima da lista, enviado como `status` no repositório.
- `status-badge` fica dentro de `batches`, ao lado de `stage-badge`.
- O motivo da recusa aparece no `batch-card`.

**Recusa:** o componente `reject-modal` usa `app-modal` e `text-field` e chama `PATCH /batches/{id}/reject`.

**Produtos:**
- Nova feature `features/products` (lista e modal de criação) com rota `products`, protegida por `roleGuard` (`['admin','supplier']`) e por um guard de companhia fornecedora. O guard é uma função de 3 linhas que usa `session.companyType()`.
- O repositório `batches/infrastructure/product` e o modelo de produto se mudam para essa feature e são exportados pelo `index.ts`, porque o modal de lote passa a consumi-los.

## 6. Certificações

- **Página nova:** `features/certifications` ganha `presentation/pages/list` e a rota `certifications` (guard `companyTypes: ['supplier']`). A página lista as certificações do fornecedor logado, cadastra com o `form` que já existe e muda o status das próprias certificações (RF-17).
- **Sem o modal:** a página não usa o `certifications-modal` de `suppliers`. A lista e as ações dele são extraídas para um componente da feature `certifications`, usado nos dois lugares.
- **Varejista:** no `certifications-modal` da tela de Fornecedores, a mudança de status some. O auditor do varejista só consulta.

## 7. Testes

**Unitários:**
- Landing: CTA → `/planos`.
- Planos: renderiza os três planos da API; **Escolher** leva a `/cadastro?plano=PRO`.
- Cadastro:
  - Plano inválido redireciona.
  - Não avança com campo inválido.
  - 409 de CNPJ volta para o passo Empresa com o erro.
  - No sucesso, chama `setSession` e navega para `/dashboard`.
- Usuários: `creatableRoles` por tipo; o modal não tem seletor de fornecedor; para o auditor, a lista aparece sem o botão de criar e sem o menu de perfil.
- Navegação: `navLinksFor` devolve os menus do RF-08a para cada combinação; o guard bloqueia `/suppliers` para fornecedor e `/products` para varejista.
- Fornecedores: o toggle envia `workedWith=true` e grava no `localStorage`; ao reabrir, o toggle volta como estava; o selo e o botão de relatórios aparecem só com `workedWith`.
- Dashboard: o fornecedor vê "Lotes pendentes".
- Lotes:
  - `canCreateBatch`, `canAddStageTo` e `canReject` por perfil e status.
  - O modal envia `{ productId, supplierId, quantity }`.
- Fornecedores: a página não tem o botão **+ Novo fornecedor**.

**Cypress:**
- `login.cy.ts`: CTA → planos → **Entrar** → login.
- `register-batch-flow.cy.ts`: passa a usar o perfil `manager` e o body novo.
- `signup.cy.ts` (novo): planos → cadastro de varejista → dashboard, com a API mockada.
