# Especificação — Gestão de produtos no pedido de lote

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Contrato e regras da API: `supply-chain-verde-api/docs/features/015-gestao-produtos/spec.md`. Depende da `013-busca-full-text`.

## 1. Problema

- O modal "Pedir novo lote" tem 4 passos: categoria + unidade → fornecedor → produto do fornecedor → revisão. O mercado escolhe dois enums antes de ver qualquer produto.
- O passo 3 pode vir vazio ("Este fornecedor não tem produtos nessa categoria e unidade"), e o mercado precisa voltar.
- O passo 1 não tem busca.

## 2. Objetivo

O modal passa a ter 2 passos: **Produto → Revisão**. O passo 1 é uma lista paginada de produtos de todos os fornecedores, com busca e filtro opcional de categoria/unidade. A lista vem ordenada pelo que o mercado mais pediu nos últimos 30 dias e depois pelo menor CO₂ por unidade. Escolher o produto já define o fornecedor.

## 3. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | Passo 1: campo de busca, os dois `app-enum-select` (categoria e unidade) como filtros opcionais com a opção "Todas", e uma grade de produtos paginada. |
| RF-02 | Cada card mostra o nome do produto, o fornecedor (`supplierName`), o CO₂ (`co2KgPerUnit` kg CO₂e/símbolo da unidade, ou "Sem histórico") e, quando `acceptedBatchesLast30Days > 0`, "N lotes nos últimos 30 dias". |
| RF-03 | A ordem é a da API (API RN-02). O front não reordena. |
| RF-04 | O selo "Recomendado" vai no 1º card da 1ª página quando esse card tem `co2KgPerUnit`, a mesma regra de hoje aplicada ao produto. |
| RF-05 | Mudar a busca ou um filtro recarrega a partir da 1ª página e limpa a seleção. |
| RF-06 | Passo 2 (revisão): quantidade com o símbolo da unidade do produto, mais produto, fornecedor e categoria/unidade. O pedido manda `productId`, o `supplierId` do produto e `quantity` (contrato atual). |
| RF-07 | Sem resultado: "Nenhum produto encontrado.", e "Tentar carregar novamente" em caso de erro, como no passo de fornecedor de hoje. |

## 4. Fora do escopo

- Tela de produtos para o mercado.
- Mudanças na tela de produtos do fornecedor: cada fornecedor continua cadastrando os próprios produtos, e nomes iguais entre fornecedores são aceitos.
- Agrupar produtos de mesmo nome de fornecedores diferentes.

## 5. Critérios de aceite

- Ao abrir o modal, a lista de produtos aparece já ordenada, sem exigir categoria nem unidade.
- Buscar "serra" mostra os produtos de "Grãos da Serra Cooperativa".
- Filtrar por categoria e por unidade funciona com cada filtro sozinho e com os dois juntos.
- Escolher um produto e avançar leva à revisão. "Pedir lote" manda o `productId` e o `supplierId` do card.
- `npm test` e `npm run cypress:run` verdes.
