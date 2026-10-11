# Tarefas — Reestruturação de pastas

> Requisitos em [`spec.md`](spec.md); arquitetura e decisões em [`plan.md`](plan.md). Cada subtask é um branch/PR para `main`, em sequência. Todas passam pela [verificação](plan.md#6-verificação-todo-pr).

**Status:** concluído (PRs #41–#53).

---

## Task 1 — core

### 1.1 `refactor/core-auth-folder` (#41)

- [x] Mover `core/session/` → `core/auth/session/`, `core/guards/` → `core/auth/guards/`, `core/interceptors/` → `core/auth/interceptors/`
- [x] Renomear `core/auth/session/index.schema.ts` → `index.model.ts` (UserRole, USER_ROLES, parseUserRole)
- [x] Corrigir imports em `app.config.ts`, `app.routes.ts`, `shared/components/top-nav`, `features/*`
- [x] Mover os 3 specs existentes (sem lógica nova)

### 1.2 `refactor/core-current-user` (#42)

- [x] Criar `core/auth/session/current-user/index.service.ts` + `index.dto.ts` + `index.service.spec.ts` (`GET /users/me`, ← `UsersService.loadCurrentUser`)
- [x] Remover `loadCurrentUser` do `UsersService`
- [x] Atualizar consumidores: dashboard, `chain/form`, `batches/list/stage-modal`, `batches/list/create-modal`

### 1.3 `refactor/core-via-cep` (#43)

- [x] Criar `core/integrations/via-cep/index.service.ts` + `index.dto.ts` + spec (← `viaCepResponseSchema` e `lookupZipCode` de suppliers)
- [x] Atualizar `features/suppliers/form` e `features/batches/list/create-modal`

### 1.4 `refactor/core-layout` (#44)

- [x] Mover `shared/components/{app-shell,top-nav,app-footer}` → `core/layout/`
- [x] Criar `core/layout/navigation/index.constants.ts` com os links por perfil (← `DASHBOARDS[role].links`); dashboard fica só com título e descrição
- [x] Adicionar `ROLE_LABELS` em `core/auth/session/index.model.ts` e remover a cópia do `top-nav`
- [x] Adicionar `SessionService.logout()` (`clearSession` + `/login`); `top-nav` usa ele e `AuthService.logout` delega
- [x] Spec de `logout`; mover e ajustar spec do `top-nav`

**Pronto:** `grep -rn "features/" src/app/core` sem resultado.

---

## Task 2 — shared (PR único, um commit por subtask) (#45)

- [x] 2.1 Excluir `shared/components/confirm-dialog/` e spec (sem uso)
- [x] 2.2 Mover `shared/components/*` → `shared/ui/*` (o `error-toast` sem alteração) e corrigir imports em `core/layout` e `features/*`
- [x] 2.3 Simplificar `EnumInputSource.options` para `readonly string[]`, remover `computed parsedOptions` e ajustar spec
- [x] 2.4 Mover `features/suppliers/index.utils.ts` + spec → `shared/utils/format/`; adicionar `formatNumberBr(value, maxFractionDigits)` + spec, substituindo `formatInteger/formatNumber` do dashboard e o `Intl` de `batches/list`
- [x] 2.5 Criar `shared/directives/close-on-outside-click/index.directive.ts` + spec (`details[appCloseOnOutsideClick]`) e aplicar no `top-nav` no lugar do `@HostListener('document:click')`

**Pronto:** `src/app/shared/components/` não existe e `grep -rn "core/\|features/" src/app/shared` sem resultado.

---

## Task 3 — features

Cada PR aplica o [padrão por feature](plan.md#2-padrão-por-feature), renomeia `component-style-N` e cria spec para cada use-case, facade, mapper, rules e VO novo.

### 3.1 `refactor/features-auth` (#46)

- [x] `infrastructure/` (`POST /auth/login`), `application/use-cases/login/` (repository + `SessionService.setSession`), `presentation/pages/login/`
- [x] Remover `login/index.ts`; `index.ts` vira o único barrel

### 3.2 `refactor/features-users` (#47)

- [x] `infrastructure/index.mapper.ts`: 3 formatos de página e conversão UPPER/lower da role
- [x] `application/use-cases/{create-user,update-role}` e `index.facade.ts`
- [x] `domain/index.rules.ts` (`canManage`)
- [x] `presentation/components/{create-modal, role-badge, role-menu}` (role-menu adota `close-on-outside-click`)

### 3.3 `refactor/features-certifications` (#48)

- [x] Camadas `domain` e `infrastructure` e `presentation/components/form`

### 3.4 `refactor/features-suppliers` (#49)

- [x] Absorver `features/reports/` → `domain/report/` + `infrastructure/report/` e excluir `features/reports/`
- [x] `domain/value-objects/{cnpj,address}`; `address` centraliza o `applyZipCodeResponse` duplicado
- [x] `infrastructure/index.mapper.ts`: normaliza `supplierName/name` e as contagens de certificações do ranking
- [x] `application/use-cases/create-supplier`, exportado no `index.ts`
- [x] Excluir `suppliers/ranking/` (sem rota)

### 3.5 `refactor/features-batches` (#50)

- [x] Absorver `features/products/` → `domain/product/` + `infrastructure/product/`
- [x] Absorver `features/chain/index.{service,schema}` + `chainResponseSchema` → `domain/stage/` + `infrastructure/stage/`
- [x] Excluir `features/chain/`, a rota `batches/:batchId/stages` e `batches/form/`
- [x] `application/use-cases/{create-batch, advance-stage}`
- [x] `presentation/components/{create-modal, stage-modal, stage-badge}`; cores de etapa vão para o CSS
- [x] `traceability` importa o model `Stage` de `batches/index.ts`

### 3.6 `refactor/features-traceability` (#51)

- [x] Camadas `domain`, `infrastructure`, `application/index.facade.ts` e `presentation/{pages/traceability, components/carbon-chart}`

### 3.7 `refactor/features-dashboard` (#52)

- [x] `application/index.facade.ts` (metrics, stageDistribution, saudação)
- [x] `presentation/components/{metric-card, stage-bar-chart, stage-pie-chart}` com a matemática dos gráficos fora do componente da página
- [x] Usar `stage-badge` de `batches/index.ts` e remover `stageLabel/stageBadgeClass`

### 3.8 `refactor/features-audit-log` (#53)

- [x] `infrastructure/index.mapper.ts` (fallback de array) e remoção dos `console.info`
- [x] `application/use-cases/export-csv` (← `exportLogs` + `loadAll` + `csvCell`) e `index.facade.ts` (filtros, paginação, `dateDaysAgo`)
- [x] `presentation/components/export-modal` e `presentation/index.labels.ts`; `actionClass` vai para o CSS

**Pronto:** não existem `features/{chain,products,reports}`, todas as features seguem o padrão e `grep -rn "\.\./\.\./[a-z-]*/index\.\(service\|schema\)" src/app/features` sem resultado.
