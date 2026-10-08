# Especificação — Reestruturação de pastas (core, shared e features)

> Refatoração estrutural do frontend, sem mudança de comportamento para o usuário. Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md).

## 1. Problema

- Componentes concentram lógica de negócio, orquestração HTTP e estilo; há mapas de classes Tailwind dentro do TS e o `batches/create-modal` chegou a 560 linhas.
- Features importam umas das outras por caminhos relativos profundos (`../../<feature>/index.service`).
- O `shared` conhece features: o `top-nav` importa `features/auth` e `features/dashboard`.
- Código legado sem uso: páginas do `chain`, `suppliers/ranking`, `batches/form` e `confirm-dialog`.

## 2. Objetivo

Adotar o padrão `core / shared / features/{domain,application,infrastructure,presentation}`, mantendo a nomenclatura `index.<tipo>.ts`, entregue em PRs atômicos.

## 3. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | `core` concentra autenticação (sessão, guards, interceptor, usuário logado), integrações externas (ViaCEP) e layout (shell, top-nav, footer, navegação por perfil). |
| RF-02 | `core` não importa nada de `features/`. |
| RF-03 | `shared` contém apenas UI genérica (`ui/`), diretivas (`directives/`) e utilitários (`utils/`), sem importar `core/` nem `features/`. |
| RF-04 | Cada feature segue as camadas `domain`, `application`, `infrastructure` e `presentation`, com `index.routes.ts` e um `index.ts` como API pública. |
| RF-05 | Imports entre features passam somente pelo `index.ts` da feature. |
| RF-06 | Estado de tela (signals) sai dos componentes para um `application/index.facade.ts`; fluxos com mais de uma chamada viram use-cases. |
| RF-07 | Mapas Tailwind no TS viram `[attr.data-*]` + `@apply` no `.css`; classes `component-style-N` ganham nomes semânticos. |
| RF-08 | Features órfãs são absorvidas: `reports` → `suppliers`, `products` e `chain` → `batches`. |
| RF-09 | Código sem uso é excluído: `confirm-dialog`, `suppliers/ranking`, `batches/form`, páginas e rota de `chain`. |
| RNF-01 | Nenhuma mudança funcional: telas, rotas públicas e contratos com a API permanecem iguais. |
| RNF-02 | Toda lógica extraída (use-case, facade, mapper, rules, value-object, util, directive) tem `index.*.spec.ts`. |
| RNF-03 | Imports continuam relativos, sem aliases de path. |

## 4. Fora de escopo

- Token `API_URL` / `core/config`: services seguem importando `environment`.
- `shared/pipes`: `formatCnpj`, `formatPhone` e `formatZipCode` são máscaras de input; o número pt-BR vira util.
- `shared/utils/date` e `shared/utils/csv`: `dateDaysAgo` e `csvCell` têm um único consumidor (audit-log) e ficam nele.
- Contrato abstrato de repositório: `infrastructure/index.repository.ts` é a classe concreta.
- Mudanças no `error-toast` além de mover a pasta.

## 5. Critérios de aceite

- [x] `grep -rn "features/" src/app/core` sem resultado.
- [x] `src/app/shared/components/` não existe e `grep -rn "core/\|features/" src/app/shared` sem resultado.
- [x] Não existem `features/{chain,products,reports}` e todas as features seguem o padrão de camadas.
- [x] `grep -rn "\.\./\.\./[a-z-]*/index\.\(service\|schema\)" src/app/features` sem resultado.
- [x] `npm test`, `npm run lint`, `npm run build` e `npx cypress run` passam em todo PR.
