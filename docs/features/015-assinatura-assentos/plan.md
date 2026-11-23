# Plano técnico — Assinatura única e ativação de usuários

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md). Os caminhos são relativos a `src/app/`.

## 1. `/assinatura` e cadastro (`features/signup`, Task 1)

- `app.routes.ts`: `path: 'planos'` vira `path: 'assinatura'` (mesmo `guestGuard`). Não há redirect de `/planos`.
- `features/signup/index.routes.ts`: o título passa a ser `'Supply Chain Verde | Assinatura'`, e o componente vira `SubscriptionComponent`.
- `presentation/pages/plans/` → `presentation/pages/subscription/` (`git mv`, e reescrever):
  - Sem repositório nem `signal`: é uma página estática. O `features` atual continua, e os itens novos são "Até 10 usuários ativos", "Desative quem saiu e libere a vaga na hora" e "Convites pendentes reservam assento".
  - Um card só, no estilo do card "Pro" destacado de hoje, para reaproveitar o CSS. O CTA "Criar conta" leva a `routerLink="/cadastro"`.
  - `// ponytail: teto fixo no texto; ler de um endpoint público se o teto virar variável por cliente.`
- `domain/index.model.ts`: saem `Plan` e `CompanySignup.planCode`.
- `infrastructure/index.repository.ts` e `index.dto.ts`: saem `listPlans` e `plansResponseSchema`.
- `pages/sign-up/index.component.ts` e `.html`:
  - Sai o `plan` signal, a leitura de `?plano`, o `backToPlans` e o guard `if (!plan)`. O `payload()` não leva argumento.
  - Cabeçalho: "Assinatura · até 10 usuários ativos" + `routerLink="/assinatura"`. "Trocar plano" sai.
  - "Voltar" leva a `/assinatura`. A linha `<dt>Plano</dt>` da revisão vira `<dt>Assinatura</dt><dd>Até 10 usuários ativos</dd>`.
  - Sai o spinner "Carregando plano…": a página não espera mais nada.
- Landing (`features/landing/.../landing/index.component.html:31`): o texto é "Conhecer a assinatura" e o link `/assinatura`.
- Cypress: `signup.cy.ts` sem intercept de `/plans`, `plan-card` e `planCode`. `login.cy.ts` sem `/plans`, e o pathname esperado passa a ser `/assinatura`.

## 2. Perfil sem plano e contador na lista (Task 2)

O contador de assentos fica na lista de usuários, ao lado de "+ Convidar usuário", e não no perfil.

- `features/profile`:
  - `domain/index.model.ts`: sai `CompanyPlan`, e `OwnCompany` perde `plan`.
  - `domain/index.rules.ts`: sai `accountsUsage`.
  - `infrastructure/index.repository.ts`: sai `plan` do schema. Saem `countCompanyUsers` e `COMPANY_USERS_LIMIT`, o que resolve o ponytail que já pedia isso.
  - `pages/profile`: o `forkJoin` vira só `getMyCompany()`, e a seção "Plano" sai.
- `features/users`:
  - `domain/index.model.ts`: `Seats = { used: number; max: number }`.
  - `domain/index.rules.ts`: `seatsUsage(seats)` → `"8 de 10 assentos em uso"` e `seatsFull(seats)`.
  - `infrastructure/index.repository.ts`: `seats()` faz `GET /companies/me` e mapeia para `{ used: seatsUsed, max: maxUsers }`. Ele não importa o repositório do perfil, para não acoplar features.
  - `UsersListFacade`: os signals `seats` e `seatsFull`, e `loadSeats()`, chamado no `init` só quando `canCreate()` (admin de companhia). Se falhar, o contador some, e a API continua barrando com 409.
  - `pages/list`: `<p data-testid="seats-counter">` no cabeçalho. "+ Convidar usuário" fica `disabled` com `title="Sem assentos livres"` quando `seatsFull()`. Depois de um convite, `loadSeats()`, porque o convite pendente já ocupa assento.

## 3. Ativação e contador (`features/users`, Task 3)

### Modelo e repositório

O `Seats`, o `seats()`, o `seatsFull` e o contador já vêm da Task 2 (§2).

- `domain/index.model.ts`: `User.active: boolean`.
- `infrastructure/index.dto.ts`: `userResponseSchema` com `active: z.boolean()`.
- `infrastructure/index.repository.ts`: `updateStatus(userId, active)` faz `PATCH /users/{id}/status` com o corpo `{ active }`.

### Regras (`domain/index.rules.ts`)

```ts
export function canToggleStatus(role: Role, actorEmail: string | null, target: User): boolean {
  return canChangeRoles(role) && !!target.companyType && target.email !== actorEmail;
}
```

A sessão (`core/auth/session`) não guarda o `userId`, então a própria linha é achada pelo `email`. O `seatsFull` já vem da Task 2.

### Facade

- Sem use case: o facade chama `repository.updateStatus` direto, porque a casca do `update-role` não acrescenta nada.
- `UsersListFacade`:
  - `updatingStatusId`, igual ao `updatingRoleId`.
  - `toggleStatus(user)` chama `updateStatus(user.userId, !user.active)`. Se der certo, faz `reload()` + `loadSeats()`. Se der erro, `toast.show(apiErrorMessage(...))`.

### Tela (`pages/list`)

- Coluna **Situação** depois de Role:
  - quando `canToggleStatus`, um botão só, em formato de pílula, com o texto `Ativo`/`Inativo`. A cor vem de `data-status` (verde ou cinza), e o clique troca a situação. O `aria-label` diz a ação ("Ativo, desativar Ana"), e o `title` também ("Clique para desativar");
  - sem permissão (a própria linha, usuário sem companhia, perfis que não gerenciam), um `<span>` com o mesmo visual, só para leitura;
  - o botão de um inativo fica `disabled` quando `seatsFull(seats())`, com `title="Sem assentos livres"`.
- `role-menu`: `[disabled]` passa a ser `updatingRoleId === item.userId || !item.active`.
- Linha inativa com `class="users-row-inactive"`: nome, email e data com opacidade reduzida.
- O `colspan` da linha vazia sobe 1 (6/5).

## 4. Filtros (`features/users`, Task 4)

- `UsersRepository.load({ limit, offset, email?, roles?, active? })`: cada role entra com `params.append('role', r.toUpperCase())`. `active` vai só se não for `null`.
- Facade:
  - `roles = signal<UserRole[]>([])` e `active = signal<boolean | null>(null)`.
  - `toggleRole(r)` liga ou desliga a role na lista, e `setActive(v)` troca a situação. Os dois zeram o `offset` e fazem `reload()` direto, sem debounce, porque não há digitação.
  - `filterRoles = computed(() => role === 'platform_admin' ? USER_ROLES : ROLES_BY_COMPANY_TYPE[companyType] ?? [])`. Sem perfis, o grupo Perfil não aparece.
- Tela: dentro do card da busca, abaixo do campo, dois `role="group"` com rótulo (Perfil e Situação), reaproveitando o padrão `batches-filter` (`features/batches/.../list/index.component.html:21-24`):
  - Perfis: um `<button [attr.aria-pressed]="facade.roles().includes(r)">` por role, com o rótulo de `ROLE_LABELS`. Vários podem ficar pressionados.
  - Situação: Todos / Ativos / Inativos, com um só pressionado.
- `// ponytail: CSS do filtro copiado de batches; extrair para shared/ui quando houver uma terceira tela com o mesmo filtro.`

## 5. O que fica

- `features/audit-log/domain/index.labels.ts`: `company_plan: 'Plano da empresa'` **continua**. A auditoria ainda tem linhas antigas dessa tabela.
- `docs/features/009-empresas-planos`: histórico, sem mudança. A Task 5 só acrescenta a nota de substituição.

## 6. Testes

- `subscription/index.component.spec.ts`: mostra "10 usuários ativos" e o CTA aponta para `/cadastro` sem query.
- `sign-up`: o envio não tem `planCode`, e não há chamada a `/plans` (`http.expectNone`).
- `profile`: sem seção de plano e sem chamada a `GET /users`.
- `users`: o contador mostra "8 de 10 assentos em uso", só para o admin de companhia, e com 10/10 o convite fica desabilitado.
- `users/domain/index.rules.spec.ts`: `canToggleStatus` (a própria linha, `platform_admin` alvo, perfil sem permissão) e `seatsFull`.
- `users/infrastructure/index.repository.spec.ts`: `PATCH /status` com corpo, `role` repetido em `getAll('role')`, e `active` ausente quando `null`.
- `users/application/index.facade.spec.ts`: `toggleStatus` recarrega a lista e os assentos, o erro vai ao toast, e `toggleRole`/`setActive` zeram o offset.
- `pages/list/index.component.spec.ts`: a pílula é só leitura na própria linha, a de um inativo fica desabilitada com assentos cheios, o menu de perfil fica desabilitado em inativo, e os badges ficam pressionados.
