# Tarefas: Endereços das etapas do lote

> Os requisitos estão em [`spec.md`](spec.md) e a arquitetura em [`plan.md`](plan.md).

**Status:** planejada.

Cada task mexe em **no máximo 10 arquivos** (os specs contam) e deixa o `npm test` verde. As dependências "API Task N" apontam para `supply-chain-verde-api/docs/features/018-enderecos-etapas/tasks.md`.

Ordem entre os repositórios: **API Task 1 + web Task 1 (deploy junto) → API Task 2**.

O body do `POST /stages` muda de forma incompatível, então esta task e a API Task 1 sobem juntas. A API Task 2 só mexe no banco e não afeta o front.

---

### Task 1: `feat/destino-etapa`

Sobe no mesmo deploy da API Task 1.

- [ ] `domain/stage/index.model.ts`: `NewStageAddress`, `NewStage.destination` e `placeLabel` (plan §1, §3)
- [ ] `features/profile/index.ts`: exportar `ProfileRepository`
- [ ] `application/add-stage/index.facade.ts`: `ownAddress` pelo `getMyCompany`, sem o catálogo de fornecedores (plan §2)
- [ ] `shared/forms/company-fields/index.helper.ts`: extrair `formatZipCodeWhileTyping`
- [ ] `stage-modal` (ts, html, css): origem em texto, grupo `destination` com CEP, Varejo só leitura (plan §3)
- [ ] `pages/list/index.component.html`: input `[origin]`
- [ ] Specs: facade, modal e `register-batch-flow.cy.ts`

Se passar de 10 arquivos, o Cypress vai num commit próprio da mesma branch.

**Arquivos (~11):** `stage/index.model.ts`, `profile/index.ts`, `add-stage/index.facade.ts`, `company-fields/index.helper.ts`, `stage-modal/*` (3), `list/index.component.html`, specs.

**Pronto:** `npm test` verde. No compose, com a API Task 1, a rota de um lote novo vai do fornecedor, passa pelos destinos digitados e termina no endereço do mercado.
