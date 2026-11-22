# Plano técnico — Gestão de produtos no pedido de lote

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. Modelo e repositório (`features/products`)

```ts
// domain/index.model.ts — campos do catálogo do mercado; null na visão do fornecedor (API RN-07)
export interface Product {
  productId: number;
  supplierId?: number | null;
  name: string;
  description?: string | null;
  category: ProductCategory;
  unit: ProductUnit;
  supplierName?: string | null;
  co2KgPerUnit?: number | null;
  acceptedBatchesLast30Days?: number | null;
}
```

- `infrastructure/index.dto.ts`: o `productResponseSchema` (zod) ganha os mesmos campos, todos `.nullable().optional()`. Assim a tela do fornecedor, que não recebe esses campos, continua validando.
- `ProductsRepository.load` aceita `category?` e `unit?` e só os envia quando existem:

```ts
load(params: { limit: number; offset: number; search?: string; category?: ProductCategory; unit?: ProductUnit })
```

- O `loadAll()` (lista de lotes) continua igual. Com a API 015 ele recebe os itens em outra ordem e com campos a mais, e nada disso afeta o uso dele, que é procurar a unidade do produto.

## 2. Facade (`batches/application/create-batch/index.facade.ts`)

```ts
export type CreationStep = 0 | 1;

readonly category = signal<ProductCategory | null>(null);
readonly unit = signal<ProductUnit | null>(null);
readonly selectedProduct = signal<Product | null>(null);
readonly products = new PagedSearch<Product>(
  (query) => this.productsRepository.load({ ...query, category: this.category() ?? undefined, unit: this.unit() ?? undefined }),
  { load: 'Não foi possível carregar os produtos. Tente novamente.', page: 'Não foi possível carregar esta página de produtos.' },
  (message) => this.error.set(message),
  this.destroyRef,
);
```

- **Saem:** `selectedSupplier`, `supplierProducts`, `loadingProducts`, `recommendationCriteria`, `suppliers`, `loadSupplierProducts` e a dependência de `SuppliersRepository`.
- **Carga inicial:** `products.load()` no construtor, porque a lista não depende de filtro.
- **Filtros:** `setCategory`/`setUnit` atualizam o signal, limpam `selectedProduct` e chamam `products.load()` (RF-05). Um `effect` sobre os dois signals também resolveria, mas a chamada direta é mais simples de seguir.
- **Busca:** `products.searchFor(term)`, que é a mesma do `PagedSearch` de hoje.
- **`unitSymbol`:** passa a vir de `selectedProduct()?.unit`.
- **`stepProblem`:** o passo 0 exige `selectedProduct`.
- **`submit`:** `{ productId, supplierId: selectedProduct.supplierId, quantity }` (RF-06).

## 3. Modal (`batches/presentation/components/create-modal`)

- `steps = ['Produto', 'Revisão']`.
- Passo 0: o cabeçalho com o `app-text-field` de busca (como o `#batch-supplier-search` de hoje, agora `#batch-product-search`), uma linha com os dois `app-enum-select` (placeholder "Todas"), a grade `picker-grid` de cards e o `app-pagination`. O card segue o layout do card de fornecedor de hoje (RF-02).
- Passo 1: a revisão de hoje, com "Fornecedor" lido de `selectedProduct().supplierName`.
- `isRecommended` (`batches/domain/index.rules.ts`) passa a receber `Product`: `page === 0 && index === 0 && product.co2KgPerUnit != null` (RF-04).
- O CSS só ajusta a linha dos filtros. O resto reaproveita as classes `picker-*`.

## 4. Remoção do que ficou sem uso (Task 3)

Depois da Task 2, `grep -rn "loadBySupplier\|RecommendationCriteria\|co2KgPerUnit" src/app` só deve achar:

- `ProductsRepository.loadBySupplier`, junto com o comentário `ponytail:` dele, que pedia exatamente essa troca;
- `RecommendationCriteria` (model, barrel `suppliers/index.ts`), mais o parâmetro `criteria` de `SuppliersRepository.loadRanking`;
- `SupplierRanking.co2KgPerUnit` (model e dto).

Esses itens são apagados, e só depois disso a API Task 2 tira os parâmetros da rota.

## 5. Testes

- `products/infrastructure/index.repository.spec.ts`: `load` envia `category`/`unit` só quando presentes, e o schema aceita item com e sem os campos novos.
- `create-batch/index.facade.spec.ts`:
  - carrega ao construir; filtro recarrega e limpa a seleção;
  - não avança sem produto;
  - `submit` usa o `supplierId` do produto.
- `create-modal/index.component.spec.ts`: renderiza os cards com fornecedor, CO₂ e o "N lotes nos últimos 30 dias" condicional, mais o selo "Recomendado".
- `batches/domain/index.rules.spec.ts`: `isRecommended` com `Product`.
- `cypress/e2e/register-batch-flow.cy.ts`:
  - os intercepts de `suppliers?ranked=true` e de `products?supplierId=9` saem;
  - `GET /products*` devolve itens com os campos novos;
  - fluxo: buscar → escolher o card → revisar → pedir; o `POST /batches` sai com `productId` e `supplierId` do card.
