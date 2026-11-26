# Tarefas: Cálculo de carbono

> Os requisitos estão em [`spec.md`](spec.md) e a arquitetura em [`plan.md`](plan.md).

**Status:** planejada.

Cada task mexe em **no máximo 10 arquivos** (os specs contam) e deixa o `npm test` verde. As dependências "API Task N" apontam para `supply-chain-verde-api/docs/features/019-calculo-de-carbono/tasks.md`.

Ordem entre os repositórios: **API Task 1 → API Task 2 → API Task 3 → web Task 1 → API Task 4 → web Task 2 → web Task 3 → API Task 5 → API Task 6**.

- A web Task 1 espera a API Task 2 porque tirar `IPCC` do `z.enum` antes da `V22` quebra a listagem de lotes.
- A API Task 4 (cálculo por atividade) vem antes da web Task 2 para que nenhuma emissão nova seja gravada com o fator fixo de 0,15. No intervalo entre as duas, marcar a caixa de emissão numa etapa fixa devolve 400 e a etapa fica salva sem emissão. Por isso a web Task 2 deve ir para produção logo em seguida.
- A API Task 5 (bloqueio) espera a web Task 3 (emissão pendente). Sem ela, um lote com etapa sem emissão travaria sem saída na interface.

---

### Task 1: `feat/contrato-emissao`

Depende da API Task 2 (`V22`) e da API Task 3 (`GET /emission-factors`) em produção.

- [x] `domain/stage/index.model.ts`: `CALCULATION_METHODS` só com `GHG_PROTOCOL` e `DEFRA`, `isTransportStage`, `ENERGY_SOURCES` (labels e unidades), `EmissionFactor`, `NewEmission` e os campos novos de `CarbonEmission` (plan §1)
- [x] `infrastructure/stage/index.dto.ts`: `emissionFactorSchema` e os campos novos `nullable().optional()`
- [x] `infrastructure/stage/index.repository.ts` (+ spec): `listEmissionFactors` e o novo corpo de `calculateEmission`
- [x] `domain/index.rules.ts` (+ spec): `derivedCargoWeightKg`, `methodsFor` e `fuelsFor` (plan §2)
- [x] `stage-modal/index.component.ts`: só o que deixar de compilar com o enum novo. O passo continua como está até a Task 2

**Arquivos (~7):** `stage/index.model.ts`, `stage/index.dto.ts`, `stage/index.repository*`, `index.rules*`, `stage-modal/index.component.ts`.

**Pronto:** `npm test` verde. Um lote mockado com emissão sem os campos novos continua passando no `parse`.

### Task 2: `feat/emissao-obrigatoria`

Depende da Task 1 e da API Task 4 em produção.

- [x] `advance-stage/index.use-case.ts` (+ spec): `emission: NewEmission` obrigatório (plan §3)
- [x] `add-stage/index.facade.ts` (+ spec): `factors` no `forkJoin`, a mensagem de erro da API no passo `emission`, `startPending` e a remoção do `canCalculateEmission`
- [x] `stage-modal` (ts, html, css e spec): sem a caixa, os grupos `transport` e `consumption`, o peso derivado e travado, os selects filtrados, o fator na revisão, a remoção do `@else` da RF-08 e as entradas `unit`, `quantity` e `pendingStage` (plan §4)
- [x] `pages/list/index.component.html`: passar `unit` e `quantity` ao modal

**Arquivos (~10):** `advance-stage/*`, `add-stage/*`, `stage-modal/*` (4), `pages/list/index.component.html`.

**Pronto:** `npm test` verde. No compose, registrar a Produção exige fonte e consumo, e o card mostra o CO₂e. Num lote em `TON`, a Distribuição mostra o peso travado.

### Task 3: `feat/emissao-pendente`

Depende da Task 2.

- [ ] `domain/index.rules.ts` (+ spec): `pendingEmissionStage`, `canCalculatePendingEmission` e o `canAddStageTo` sem a etapa pendente (plan §5)
- [ ] `application/index.facade.ts` (+ spec): `canCalculatePendingEmission`
- [ ] `batch-card` (html, ts e spec): o botão **Calcular emissão**
- [ ] `pages/list` (html e ts): `emissionBatch` e o modal com `pendingStage`
- [ ] Cypress `register-batch-flow.cy.ts`: a emissão obrigatória e a emissão pendente

Se passar de 10 arquivos, o Cypress vai num commit próprio da mesma branch.

**Arquivos (~10):** `index.rules*`, `index.facade*`, `batch-card/*` (3), `pages/list/*` (2), Cypress.

**Pronto:** `npm test` verde. No compose, um lote com a última etapa sem emissão mostra **Calcular emissão** e não mostra **Adicionar etapa**. Depois do cálculo, **Adicionar etapa** volta.
