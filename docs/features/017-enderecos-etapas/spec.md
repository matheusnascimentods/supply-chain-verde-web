# Especificação: Endereços das etapas do lote

> A arquitetura está em [`plan.md`](plan.md) e a execução em [`tasks.md`](tasks.md). A contraparte na API fica em `supply-chain-verde-api/docs/features/018-enderecos-etapas/`. As regras RN-xx citadas aqui são de lá.

## 1. Problema

- No modal **Adicionar etapa**, os selects de Origem e Destino só oferecem o endereço do próprio fornecedor (o mercado vê o de todos os fornecedores). Por isso todo lote termina no fornecedor ou sem destino, e o card mostra sempre o mesmo destino.
- Origem e destino são opcionais e independentes, então a rota do lote pode ter buracos e saltos.

## 2. Objetivo

- O dono da etapa digita o **destino** (endereço completo, com busca por CEP). A origem aparece só como informação.
- No Varejo, o mercado não informa endereço, porque o destino é o próprio endereço dele.

## 3. Regras de exibição

| ID | Regra | API |
|---|---|---|
| RF-01 | O modal não tem mais o campo **Origem**. Ele mostra o texto "Origem: <logradouro, número – cidade/UF>". Sem etapas, a origem é o endereço da companhia de quem está logado (o fornecedor, na Produção). Com etapas, é o `destinationAddress` da última etapa do lote. | RN-04 |
| RF-02 | De Produção a Distribuição, o modal tem a seção **Destino** com CEP, UF, logradouro, número, bairro, complemento (opcional) e cidade. Os obrigatórios seguem a RN-01. O CEP com 8 dígitos preenche logradouro, bairro, cidade e UF pelo ViaCEP, como no cadastro. | RN-01 |
| RF-03 | O formulário de destino começa vazio em toda etapa, mesmo quando o lote fica no mesmo lugar. | RN-01 |
| RF-04 | No Varejo, a seção Destino vira o texto "Destino: <endereço do mercado>", sem formulário, e o request não envia `destination`. | RN-03 |
| RF-05 | O select de endereços e o carregamento do catálogo de fornecedores saem do modal. A mensagem "Carregando endereços disponíveis…" passa a ser "Carregando…" e cobre só o usuário responsável e a companhia. | — |
| RF-06 | O card do lote e a rastreabilidade não mudam: continuam lendo `originAddress` e `destinationAddress` do response, e agora os dois sempre vêm preenchidos para etapas novas. | RN-06 |
| RF-07 | Um 400 da API (destino incompleto) mostra a mensagem dela no erro do modal que já existe. | RNF-01 |

## 4. Fora do escopo

- Reaproveitar um endereço já usado, sugerir o anterior ou ter um atalho "permanece no local".
- Mostrar a rota completa no modal.
- Editar o destino de uma etapa já registrada.

## 5. Critérios de aceite

- Como `supplier`, em lote Pendente: o modal mostra "Origem: <endereço do fornecedor>" e o formulário de destino vazio. **Registrar etapa** fica bloqueado enquanto faltar algum campo obrigatório. Digitar um CEP válido preenche o endereço.
- Depois de registrar a Produção com destino em Campinas/SP, o modal do Armazenamento mostra "Origem: … Campinas/SP", e o card mostra a rota terminando em Campinas, SP.
- Como `manager`, em lote na Distribuição: o modal do Varejo mostra origem e destino só como texto, sem campos de endereço. Ao registrar, o card mostra o destino no endereço do mercado.
- `npm test` passa, e o Cypress `register-batch-flow.cy.ts` preenche o destino.
