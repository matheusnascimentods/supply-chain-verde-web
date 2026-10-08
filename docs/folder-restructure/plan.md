# Plano técnico — Reestruturação de pastas

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. Estrutura alvo

```text
src/app/
├── core/
│   ├── auth/
│   │   ├── session/          # SessionService, index.model.ts (UserRole, ROLE_LABELS), current-user/
│   │   ├── guards/
│   │   └── interceptors/
│   ├── integrations/via-cep/
│   └── layout/               # app-shell, top-nav, app-footer, navigation/index.constants.ts
├── shared/
│   ├── ui/                   # spinner, enum-select, error-toast
│   ├── directives/close-on-outside-click/
│   └── utils/format/
└── features/<feature>/
    ├── domain/               # index.model.ts, index.rules.ts, value-objects/
    ├── application/          # index.facade.ts, use-cases/<nome>/index.use-case.ts
    ├── infrastructure/       # index.repository.ts, index.dto.ts, index.mapper.ts
    ├── presentation/         # pages/<nome>/, components/<nome>/
    ├── index.routes.ts
    └── index.ts              # API pública da feature
```

## 2. Padrão por feature

| Arquivo | Origem / papel |
|---|---|
| `domain/index.model.ts` | Tipos de domínio; `index.rules.ts` quando há regra (ex.: `canManage`). |
| `application/index.facade.ts` | Estado em signals que vivia no componente. |
| `application/use-cases/<nome>/index.use-case.ts` | Orquestração de várias chamadas (ex.: `create-batch`, `advance-stage`, `export-csv`). |
| `infrastructure/index.repository.ts` | ← `index.service.ts`. Classe concreta, sem interface. |
| `infrastructure/index.dto.ts` | ← `index.schema.ts` (schemas Zod da API). |
| `infrastructure/index.mapper.ts` | Só quando o DTO diverge do model. |
| `presentation/pages|components/<nome>/` | Componentes enxutos; os specs mockam o facade. |
| `index.routes.ts` | ← `routes.ts` ou rota inline no `app.routes.ts`. |
| `index.ts` | Único ponto de import para outras features. |

Estilo: mapas de classes no TS viram `[attr.data-*]` + `@apply` no `.css`; `component-style-N` é renomeado para nomes semânticos na mesma PR da feature.

## 3. Decisões

- **Branches:** um branch por subtask, saído da `main` atualizada, PR direto para `main`, em sequência (só começa após o merge da anterior). Exceção: a Task 2 (shared) vai em um único PR com um commit por subtask.
- **Features:** 1 PR por feature, incluindo `batches`, mesmo grande.
- **Imports:** relativos, sem aliases; cada PR corrige o que quebrar.
- **Testes:** specs existentes acompanham os arquivos movidos; toda lógica extraída ganha spec.
- **Toast:** só muda de pasta.
- **Commits:** Conventional Commits com tipo em inglês e texto em PT, via skill `commit-message`, sem trailer `Co-Authored-By`.

## 4. Simplificações (ponytail)

- Sem `core/config` (token `API_URL`): indireção com uma implementação só.
- Sem `shared/pipes`: as funções de formato são máscaras de input.
- Sem `shared/utils/{date,csv}`: consumidor único, ficam no audit-log.

## 5. Movimentações relevantes

| De | Para |
|---|---|
| `core/{session,guards,interceptors}` | `core/auth/{session,guards,interceptors}` |
| `UsersService.loadCurrentUser` | `core/auth/session/current-user` |
| `viaCepResponseSchema` + `lookupZipCode` (suppliers) | `core/integrations/via-cep` |
| `shared/components/{app-shell,top-nav,app-footer}` | `core/layout/` |
| `DASHBOARDS[role].links` | `core/layout/navigation/index.constants.ts` |
| `shared/components/*` | `shared/ui/*` |
| `features/suppliers/index.utils.ts` | `shared/utils/format/` (+ `formatNumberBr`) |
| `features/reports/` | `features/suppliers/{domain,infrastructure}/report/` |
| `features/products/` | `features/batches/{domain,infrastructure}/product/` |
| `features/chain/index.{service,schema}` + `chainResponseSchema` | `features/batches/{domain,infrastructure}/stage/` |
| `applyZipCodeResponse` (duplicado em suppliers e batches) | `suppliers/domain/value-objects/address` |

## 6. Verificação (todo PR)

```bash
npm test -- --watch=false
npm run lint
npm run build
npx cypress run          # login, register-batch-flow, traceability-public
```

- Smoke manual com `npm start`: login, dashboard, menu por perfil, listar/criar lote, avançar etapa, fornecedores (CEP, relatórios, certificações), usuários (trocar role), auditoria (exportar CSV) e `/rastreio/:id` sem login.
- Revisar o `git diff --stat`: só arquivos da subtask.
