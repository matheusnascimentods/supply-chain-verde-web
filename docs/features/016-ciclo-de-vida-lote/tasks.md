# Tarefas: Ciclo de vida do lote

> Os requisitos estão em [`spec.md`](spec.md) e a arquitetura em [`plan.md`](plan.md).

**Status:** planejada.

Cada task mexe em **no máximo 10 arquivos** (os specs contam) e deixa o `npm test` verde. As dependências "API Task N" apontam para `supply-chain-verde-api/docs/features/017-ciclo-de-vida-lote/tasks.md`.

Ordem entre os repositórios: **web Task 1 → API Task 1 → web Task 2 → API Task 2 → web Task 3**.

---

### Task 1: `feat/status-concluido-cancelado`

Não depende de nada e **precisa entrar em produção antes da API Task 1**: o `z.enum` quebra a listagem se receber um status desconhecido.

- [ ] `domain/index.model.ts`: `COMPLETED` e `CANCELED` em `BATCH_STATUSES` e nos labels (plan §1)
- [ ] `status-badge` (css e spec): as cores e os labels novos
- [ ] `infrastructure/index.repository.spec.ts`: o `parse` aceita `COMPLETED` e `CANCELED`

**Arquivos (~4):** `index.model.ts`, `status-badge/*`, `index.repository.spec.ts`.

**Pronto:** `npm test` verde. O filtro mostra 6 opções, e um lote mockado `COMPLETED` aparece com o badge **Concluído**.

### Task 2: `feat/acoes-por-lado-lote`

Depende da API Task 1 em produção (dono da etapa e `SUPPLIER` na emissão).

- [ ] `domain/stage/index.model.ts`: `stageOwner`
- [ ] `domain/index.rules.ts`: `TRANSITIONS`, `canMove`, `actsFor`, o novo `canAddStageTo`, o `canReject` pela tabela e o `canCalculateEmission` com `supplier` (plan §2)
- [ ] `domain/index.rules.spec.ts`: a matriz lado × etapa × status
- [ ] `application/add-stage/index.facade.spec.ts`: o `supplier` calcula a emissão

**Arquivos (~5):** `stage/index.model.ts`, `index.rules.ts`, `index.rules.spec.ts`, `add-stage/index.facade.spec.ts`.

**Pronto:** `npm test` verde. No compose, o `manager` só vê **Adicionar etapa** em lote na Distribuição, e registrar o Varejo deixa o card **Concluído**.

### Task 3: `feat/cancelar-lote`

Depende da API Task 2 em produção (`PATCH /batches/{id}/cancel`) e da Task 2.

- [ ] `index.rules.ts`: `canCancel` (+ spec)
- [ ] `infrastructure/index.repository.ts`: `cancel` (+ spec)
- [ ] `application/use-cases/cancel-batch/index.use-case.ts` e o `canCancel` na `index.facade.ts`
- [ ] `batch-card` (html, ts e spec): o botão **Cancelar pedido**
- [ ] `pages/list` (html, ts e spec): a confirmação com o `app-modal` (plan §3)
- [ ] Cypress `register-batch-flow.cy.ts`: cancelar e concluir

Se passar de 10 arquivos, o Cypress vai num commit próprio da mesma branch.

**Arquivos (~10):** `index.rules*`, `index.repository*`, `cancel-batch`, `index.facade.ts`, `batch-card/*`, `pages/list/*`, Cypress.

**Pronto:** `npm test` verde. No compose, o `manager` cancela um lote pendente e o card fica **Cancelado**. O fornecedor não vê o botão.
