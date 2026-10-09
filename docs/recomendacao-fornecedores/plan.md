# Plano técnico — Recomendação de fornecedores sustentáveis

> Requisitos em [`spec.md`](spec.md); passo a passo em [`tasks.md`](tasks.md).

## 1. Camadas

| Camada | Mudança |
|---|---|
| `suppliers/domain/index.model.ts` | `SupplierRanking.co2KgPerUnit: number \| null`; tipo `RecommendationCriteria = { productId } \| { category, unit }`. |
| `suppliers/infrastructure` | DTO com `co2KgPerUnit` nulo; `loadRanking(query, criteria?)` envia `productId` ou `category`+`unit`. |
| `batches/application/create-batch/index.facade.ts` | `computed` com o critério atual (produto selecionado ou categoria+unidade do produto pendente); um `effect` recarrega `suppliers` quando o critério muda. |
| `batches/domain/index.rules.ts` | `isRecommended(supplier, index)`: `index === 0 && supplier.co2KgPerUnit !== null`. |
| `batches/presentation/components/create-modal` | Selo "Recomendado" e o CO₂ por unidade em cada opção. |
| `shared/utils/format` | Reusar `formatNumberBr` para o valor. |

O `PagedSearch` de fornecedores já faz busca paginada; o critério entra como parte da query, sem novo estado.

## 2. Testes

- Facade: troca de produto dispara nova busca com `productId`; produto novo só busca com categoria e unidade preenchidas.
- Rules: `isRecommended` falso quando o primeiro não tem histórico.
- Repository: parâmetros enviados para cada critério.
