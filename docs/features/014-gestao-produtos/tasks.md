# Tarefas — Gestão de produtos no pedido de lote

> Requisitos em [`spec.md`](spec.md); arquitetura em [`plan.md`](plan.md).

**Status:** concluída no front; falta a verificação com a API local (API Task 1).

Depende da `013-busca-full-text`. A dependência "API Task N" aponta para `supply-chain-verde-api/docs/features/015-gestao-produtos/tasks.md`. Cada task mexe em **no máximo 10 arquivos** (specs contam). A lista de arquivos é uma estimativa.

Ordem entre os repositórios: **API Task 1 → web Task 1 → web Task 2 → web Task 3 → API Task 2 → API Task 3**.

---

### Task 1 — `feat/produtos-catalogo-repositorio`

O merge não depende da API, porque os specs usam `HttpTestingController` e os campos novos são opcionais. Só tem efeito em produção depois da API Task 1.

- [x] `Product` com `supplierId`, `supplierName`, `co2KgPerUnit` e `acceptedBatchesLast30Days` (plan §1)
- [x] `productResponseSchema` com os campos `.nullable().optional()`
- [x] `ProductsRepository.load` com `category?`/`unit?`
- [x] Spec do repositório (plan §5)

**Arquivos (~4):** `products/domain/index.model.ts`, `products/infrastructure/index.dto.ts`, `products/infrastructure/index.repository.ts` + spec.

**Pronto:** `npm test` verde, e a tela de produtos do fornecedor continua igual.

### Task 2 — `feat/pedido-lote-por-produto`

Depende da Task 1. Só tem efeito em produção depois da API Task 1.

- [x] Facade com 2 passos, `PagedSearch<Product>` e filtros opcionais (plan §2) + spec
- [x] Modal: passo de produto com busca, filtros, cards e paginação, mais a revisão (plan §3) + spec
- [x] `isRecommended` com `Product` + spec
- [x] `register-batch-flow.cy.ts` com o fluxo novo (plan §5)

**Arquivos (~10):** `create-batch/index.facade.ts` + spec, `create-modal/index.component.{ts,html,css}` + spec, `batches/domain/index.rules.ts` + spec, `cypress/e2e/register-batch-flow.cy.ts`.

**Pronto:** `npm test` e `npm run cypress:run` verdes. Com a API local, o modal abre direto na lista de produtos ordenada, e o pedido é criado.

### Task 3 — `refactor/remove-recomendacao-fornecedor`

Depende da Task 2. Libera a API Task 2.

- [x] `grep` do plan §4
- [x] Sai `ProductsRepository.loadBySupplier` + o caso no spec
- [x] Saem `RecommendationCriteria`, o parâmetro `criteria` de `loadRanking` e `SupplierRanking.co2KgPerUnit` (model, barrel, dto, repositório + spec)

**Arquivos (~7):** `products/infrastructure/index.repository.ts` + spec, `suppliers/domain/index.model.ts`, `suppliers/index.ts`, `suppliers/infrastructure/index.dto.ts`, `suppliers/infrastructure/index.repository.ts` + spec.

**Pronto:** `npm test` e `npm run lint` verdes, e o grep do plan §4 não acha nada.
