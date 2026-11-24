# Especificação: Ciclo de vida do lote

> A arquitetura está em [`plan.md`](plan.md) e a execução em [`tasks.md`](tasks.md). A contraparte na API fica em `supply-chain-verde-api/docs/features/017-ciclo-de-vida-lote/`. As regras RN-xx citadas aqui são de lá. Esta spec complementa as RF-13 a RF-15 da `009-empresas-planos`.

## 1. Problema

- Um lote que já chegou ao Varejo aparece como "Em andamento" para sempre, e o filtro "Em andamento" mistura lotes entregues com lotes em curso.
- O mercado não tem como cancelar um pedido feito por engano.
- O botão **Adicionar etapa** aparece para o mercado em etapas do fornecedor (Produção a Distribuição) e para o fornecedor no Varejo.

## 2. Objetivo

- Mostrar os status novos, **Concluído** e **Cancelado**, no card, no badge e no filtro.
- Mostrar cada ação só para o lado dono dela, espelhando a máquina de estados da API.
- Permitir que o mercado cancele um lote pendente.

## 3. Regras de exibição

| ID | Regra | API |
|---|---|---|
| RF-01 | O badge e o filtro da lista ganham **Concluído** (`COMPLETED`, verde-azulado) e **Cancelado** (`CANCELED`, cinza). Os filtros ficam na ordem Todos, Pendente, Em andamento, Concluído, Recusado e Cancelado. | RN-14 |
| RF-02 | **Adicionar etapa** só aparece para o lado dono da próxima etapa: fornecedor (`admin`/`supplier`) de Produção a Distribuição e mercado (`admin`/`manager`) no Varejo. Não aparece em lote Concluído, Recusado ou Cancelado. | RN-02, RN-08 |
| RF-03 | **Cancelar pedido** aparece para o mercado (`admin`/`manager`) em lote Pendente. Ele abre uma confirmação sem motivo. Depois de confirmar, o card mostra **Cancelado**. | RN-05 |
| RF-04 | **Recusar** não muda: fornecedor (`admin`/`supplier`) em lote Pendente. | RN-06 |
| RF-05 | Quando o mercado registra o Varejo, o card passa a mostrar **Concluído** (a lista recarrega como já faz depois de registrar uma etapa). | RN-07 |
| RF-06 | O `supplier` passa a ver a opção de calcular a emissão no modal de etapa (`canCalculateEmission`). | RN-10 |
| RF-07 | Um 403 ou 409 da API mostra a mensagem dela no toast de erro que já existe. É o caso, por exemplo, de outro usuário que cancelou ou aceitou o lote antes. | RNF-01 |

O `PLATFORM_ADMIN` continua sem as ações de lote na interface (`companyType` nulo), como hoje. A API aceita as ações dele (RN-03), mas a tela não as mostra.

## 4. Fora do escopo

- Uma tela de detalhe do lote ou uma linha do tempo das transições.
- Motivo de cancelamento.
- Ações de lote para o `PLATFORM_ADMIN` na interface.

## 5. Critérios de aceite

- Como `manager` de mercado: em lote Pendente, aparece **Cancelar pedido** e não aparece **Adicionar etapa**. Em lote Em andamento na Distribuição, aparece **Adicionar etapa** (Varejo). Em lote na Armazenagem, nenhuma ação aparece.
- Como `supplier`: em lote Pendente, aparecem **Recusar** e **Adicionar etapa** (Produção). Em lote na Distribuição, nenhuma ação aparece.
- Registrar o Varejo deixa o card **Concluído**, e o filtro **Concluído** o mostra.
- Cancelar deixa o card **Cancelado**, sem ações.
- `npm test` passa, e o Cypress `register-batch-flow.cy.ts` cobre cancelar e concluir.
