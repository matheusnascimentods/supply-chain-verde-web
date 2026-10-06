# Reestruturação de pastas: core, shared e features

## Contexto

Hoje os componentes concentram lógica de negócio, orquestração HTTP e estilo. Há mapas de classes Tailwind dentro do TS e o `batches/create-modal` tem 560 linhas. As features importam umas das outras por caminhos relativos profundos. O `shared` conhece features (o `top-nav` importa `features/auth` e `features/dashboard`). E há código legado sem uso: páginas do `chain`, `suppliers/ranking`, `batches/form` e `confirm-dialog`.

O objetivo é adotar o padrão `core / shared / features/{domain,application,infrastructure,presentation}`, mantendo a nomenclatura `index.<tipo>.ts`, com PRs atômicos.

## Decisões tomadas

- **Branches:** cada subtask é um branch saído da `main` atualizada, com PR direto para `main`. Os PRs são feitos em sequência: cada subtask só começa depois do merge da anterior.
- **Imports:** continuam relativos, sem aliases. Cada PR corrige os imports que quebrar.
- **Features:** 1 PR por feature, incluindo o `batches`, que fica grande. Cada PR já inclui a renomeação das classes `component-style-N` para nomes semânticos, nos `.html` e `.css` daquela feature.
- **Testes:** os specs existentes acompanham os arquivos movidos. Toda lógica extraída (use-case, facade, mapper, rules, value-object, util, directive) ganha um `index.*.spec.ts`. Os specs de componente passam a mockar o facade.
- **Repositório:** sem contrato abstrato. O `infrastructure/index.repository.ts` é a classe concreta.
- **Toast:** fica como está. Na Task 2 ele só é movido de pasta, sem mudança de código.
- **Commits:** Conventional Commits com tipo em inglês e texto em PT, via skill `commit-message`. Sem trailer `Co-Authored-By`.

## Simplificações em relação à proposta anterior (ponytail)

- **Sem `core/config` (token `API_URL`).** Os services continuam importando `environment`. O token seria uma indireção com uma implementação só.
- **Sem `shared/pipes`.** `formatCnpj`, `formatPhone` e `formatZipCode` são máscaras de input, não formatação de exibição. O número em pt-BR vira util.
- **Sem `shared/utils/date` e `shared/utils/csv`.** `dateDaysAgo` e `csvCell` têm um único consumidor (audit-log) e ficam dentro dele.

---

## Task 1: core


### 1.1 `refactor/core-auth-folder`: agrupar a autenticação em `core/auth`
- Mover `core/session/` → `core/auth/session/`, `core/guards/` → `core/auth/guards/` e `core/interceptors/` → `core/auth/interceptors/`.
- Renomear `core/auth/session/index.schema.ts` → `index.model.ts` (UserRole, USER_ROLES, parseUserRole).
- Corrigir imports em `app.config.ts`, `app.routes.ts`, `shared/components/top-nav`, `features/*`.
- Salvar este plano em `docs/plans/2026-10-06-folder-restructure.md`.
- Sem lógica nova, então sem spec novo; os 3 specs existentes são movidos.

### 1.2 `refactor/core-current-user`: usuário logado no core
- Criar `core/auth/session/current-user/index.service.ts` + `index.dto.ts` + `index.service.spec.ts`. Ele faz o `GET /users/me`, código que sai de `UsersService.loadCurrentUser` (`features/users/index.service.ts:39`).
- Remover `loadCurrentUser` do `UsersService`.
- Atualizar os 4 consumidores: `features/dashboard/index.component.ts:106`, `features/chain/form/index.component.ts:65`, `features/batches/list/stage-modal/index.component.ts:83,92` e `features/batches/list/create-modal/index.component.ts:455`.

### 1.3 `refactor/core-via-cep`: integração ViaCEP no core
- Criar `core/integrations/via-cep/index.service.ts` + `index.dto.ts` + spec. Saem `viaCepResponseSchema` (`features/suppliers/index.schema.ts:40`) e `lookupZipCode` (`features/suppliers/index.service.ts:39`).
- Atualizar `features/suppliers/form` e `features/batches/list/create-modal`.

### 1.4 `refactor/core-layout`: layout desacoplado das features
- Mover `shared/components/{app-shell,top-nav,app-footer}` → `core/layout/`.
- Criar `core/layout/navigation/index.constants.ts` com os links do menu por perfil, que saem de `DASHBOARDS[role].links` (`features/dashboard/index.constants.ts`). O dashboard fica só com título e descrição.
- Adicionar `ROLE_LABELS` em `core/auth/session/index.model.ts`, removendo a cópia em `top-nav`.
- Adicionar `logout()` ao `SessionService` (`clearSession` + navegar para `/login`). O `top-nav` passa a usá-lo e para de importar `features/auth`, e o `AuthService.logout` delega para ele.
- Spec: `logout` no `core/auth/session/index.service.spec.ts`. O `top-nav` spec é movido e ajustado.

**Critério de pronto da Task 1:** `grep -rn "features/" src/app/core` sem resultado.

---

## Task 2: shared


### 2.1 `refactor/shared-remove-confirm-dialog`
- Excluir `shared/components/confirm-dialog/` e o spec. Não há nenhum uso.

### 2.2 `refactor/shared-ui-folder`
- Mover `shared/components/*` → `shared/ui/*`, apenas move. O `error-toast` vai junto, sem alteração.
- Corrigir os imports em `core/layout` e `features/*`.

### 2.3 `refactor/shared-enum-select-options`
- Simplificar `options` de `EnumInputSource` para `readonly string[]` (`shared/ui/enum-select/index.component.ts`). Todos os consumidores já passam `schema.options`.
- Remover o `computed parsedOptions` e ajustar o spec existente.

### 2.4 `refactor/shared-format-utils`
- Mover `features/suppliers/index.utils.ts` + spec → `shared/utils/format/index.utils.ts` (+ spec).
- Adicionar `formatNumberBr(value, maxFractionDigits)` com spec, substituindo `dashboard.formatInteger/formatNumber` (`features/dashboard/index.component.ts:127-133`) e o `Intl` em `features/batches/list/index.component.ts:223`.
- Atualizar os imports em `suppliers/form` e `batches/create-modal`.

### 2.5 `refactor/shared-click-outside`
- Criar `shared/directives/click-outside/index.directive.ts` + spec.
- Aplicar no `core/layout/top-nav` (substitui o `@HostListener('document:click')`). O `users/list` adota na 3.2.

**Critério de pronto da Task 2:** `src/app/shared/components/` não existe, e `grep -rn "core/\|features/" src/app/shared` sem resultado.

---

## Task 3: features


Padrão aplicado em cada PR de feature:
- `domain/index.model.ts` (+ `index.rules.ts` se houver regra).
- `application/index.facade.ts` (estado em signals que hoje vive no componente) e `application/use-cases/<nome>/index.use-case.ts`.
- `infrastructure/index.repository.ts` (← `index.service.ts`), `index.dto.ts` (← `index.schema.ts`) e `index.mapper.ts` quando o DTO diverge do model.
- `presentation/pages/<nome>/` e `presentation/components/<nome>/`.
- `index.routes.ts` (← `routes.ts` ou rota inline no `app.routes.ts`) e `index.ts` como API pública. Outras features só importam por ele.
- Mapas Tailwind no TS viram `[attr.data-*]` + `@apply` no `.css`, e as classes `component-style-N` são renomeadas.
- Spec para cada use-case, facade, mapper, rules e VO novo.

### 3.1 `refactor/features-auth`
- `infrastructure/` (POST `/auth/login`), `application/use-cases/login/` (repository + `SessionService.setSession`) e `presentation/pages/login/`.
- Remover `login/index.ts`; `index.ts` passa a ser o único barrel.

### 3.2 `refactor/features-users`
- `infrastructure/index.mapper.ts`: os 3 formatos de página e a conversão UPPER/lower da role (`features/users/index.service.ts:10-50`).
- `application/use-cases/{create-user,update-role}` e `index.facade.ts`.
- `domain/index.rules.ts` (`canManage`).
- `presentation/components/{create-modal (← users/form), role-badge (← roleLabel/roleStyle, usa ROLE_LABELS), role-menu (← positionRoleMenu/onRoleMenuKeydown + click-outside)}`.

### 3.3 `refactor/features-certifications`
- Camadas `domain` e `infrastructure` e `presentation/components/form`.

### 3.4 `refactor/features-suppliers`
- Absorve `features/reports/` → `domain/report/` + `infrastructure/report/`, e exclui `features/reports/`.
- `domain/value-objects/{cnpj,address}`. O `address` centraliza o `applyZipCodeResponse`, hoje duplicado em `suppliers/form:207` e `batches/create-modal:424`.
- `infrastructure/index.mapper.ts`: normaliza `supplierName/name` e os 3 campos de contagem de certificações do ranking.
- `application/use-cases/create-supplier` (exportado no `index.ts` para o batches).
- Excluir `suppliers/ranking/`, que não tem rota.

### 3.5 `refactor/features-batches`
- Absorve `features/products/` → `domain/product/` + `infrastructure/product/`.
- Absorve `features/chain/index.{service,schema}` + `chainResponseSchema` (de `traceability/index.schema.ts`) → `domain/stage/` + `infrastructure/stage/`.
- Excluir `features/chain/` (list, form e routes), a rota `batches/:batchId/stages` do `app.routes.ts` e `batches/form/`.
- `application/use-cases/{create-batch (produto → fornecedor via suppliers/index.ts → lote), advance-stage (etapa + transporte + emissão)}`.
- `presentation/components/{create-modal, stage-modal, stage-badge}`. As cores de etapa saem de `batches/list/index.component.ts:26+` para o CSS.
- `traceability` passa a importar o model `Stage` de `batches/index.ts`.

### 3.6 `refactor/features-traceability`
- Camadas `domain`, `infrastructure` e `application/index.facade.ts`, e `presentation/{pages/traceability, components/carbon-chart}`.

### 3.7 `refactor/features-dashboard`
- `application/index.facade.ts` (metrics, stageDistribution, saudação).
- `presentation/components/{metric-card, stage-bar-chart, stage-pie-chart}`, com a matemática de `pieSegments/barHeight/pieDashArray` dentro do componente do gráfico.
- Usa `stage-badge` de `batches/index.ts` e remove `stageLabel/stageBadgeClass`.

### 3.8 `refactor/features-audit-log`
- `infrastructure/index.mapper.ts` (fallback de array) e remoção dos `console.info` do service.
- `application/use-cases/export-csv` (← `exportLogs` + `loadAll` + `csvCell`) e `index.facade.ts` (filtros e paginação, + `dateDaysAgo`).
- `presentation/components/export-modal` e `presentation/index.labels.ts` (entityLabel, fieldLabel, valueLabel, detailsLabel). O `actionClass` vai para o CSS.

**Critério de pronto da Task 3:** não existem `features/{chain,products,reports}`, todas as features seguem o padrão, e `grep -rn "\.\./\.\./[a-z-]*/index\.\(service\|schema\)" src/app/features` sem resultado (imports entre features só via `index.ts`).

---

## Verificação (em todo PR de subtask)

```bash
npm test -- --watch=false
npm run lint
npm run build
npx cypress run          # login, register-batch-flow, traceability-public
```

- Smoke manual com `npm start`: login, dashboard, menu por perfil, listar/criar lote, avançar etapa, fornecedores (CEP, relatórios, certificações), usuários (trocar role), auditoria (exportar CSV) e `/rastreio/:id` sem login.
- Revisar o `git diff --stat` do PR: só arquivos da subtask.
