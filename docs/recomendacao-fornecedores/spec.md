# Especificação — Recomendação de fornecedores sustentáveis

> Arquitetura em [`plan.md`](plan.md) e execução em [`tasks.md`](tasks.md). Regras e contrato da API: `supply-chain-verde-api/docs/recomendacao-fornecedores/spec.md`.

## 1. Problema

No modal de criar lote, o `ADMIN` escolhe o fornecedor numa lista sem nenhuma indicação de qual produz aquele produto com menos emissão.

## 2. Objetivo

Ordenar a lista de fornecedores do modal pelo produto escolhido e destacar o primeiro como recomendado.

## 3. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | Com produto existente selecionado, a lista de fornecedores é buscada com `productId`. |
| RF-02 | Com produto novo (formulário de novo produto), a lista é buscada com `category` + `unit` assim que os dois estiverem preenchidos. |
| RF-03 | Trocar produto, categoria ou unidade recarrega a lista do início. |
| RF-04 | O primeiro item recebe o selo "Recomendado" quando `co2KgPerUnit` não é nulo. |
| RF-05 | Cada fornecedor com `co2KgPerUnit` mostra o valor (ex.: "0,42 kg CO₂e/kg"); sem valor, "Sem histórico". |
| RF-06 | Antes de escolher o produto, a lista continua o ranking atual. |
| RNF-01 | Só afeta o fluxo do `admin` (o `supplier` cria lote para si mesmo). |

## 4. Fora de escopo

- Recomendação na tela de Fornecedores.
